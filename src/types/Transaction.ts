import {
    IInvokeScriptTransaction,
    IMassTransferTransaction,
    ITransaction,
    ITransferTransaction,
    WithSender
} from "@waves/waves-transactions";
import {WithId} from "@waves/waves-transactions/dist/transactions";
import {WithProofs} from "@waves/waves-transactions/src/transactions";
import {apiCall} from "../utils/utils";
import {API_BASE, BLOCK_REWARD_ACTIVATION_HEIGHT, CHAIN_ID, NG_ACTIVATION_HEIGHT} from "../secrets/secrets";
import {Block} from "./Block";
import {IOperation, Operation} from "./Operation";
import {address} from "@waves/ts-lib-crypto";

export interface ITransactionIdentifier {
    hash: string
}

export interface IApiTransaction extends ITransaction, WithId, WithProofs, WithSender, WithHeight {
}

export interface IGenesisTransaction extends IApiTransaction {
    recipient: string,
    amount: number
}

export interface WithSenderAddress {
    sender: string
}


interface WithHeight {
    height: number;
}

export class Transaction {

    private readonly hash: string;
    private readonly id: string;
    private readonly type: Number;
    private readonly body: IApiTransaction & WithHeight;
    private readonly block: Block;


    constructor(tx: IApiTransaction & WithHeight, block?: Block) {
        this.id = tx.id;
        this.hash = tx.id;
        this.type = tx.type;
        this.body = tx;
        this.block = block;
    }

    getHash() {
        return this.hash;
    }

    static async createFromIdentifier(transactionIdentifier: ITransactionIdentifier) {
        const txDetails = await apiCall(`${API_BASE}/transactions/info/${transactionIdentifier.hash}`) as IApiTransaction & WithHeight;
        const block = await new Block(txDetails.height).fetch();
        return new this(txDetails, block);
    }

    getOperations(): Promise<Array<IOperation>> {
        switch (this.type) {
            // Fees & Rewards as operations
            case 0: {
                return this.getRewardWithFeesOperations();
            }
            case 1: {
                return this.getGenesisOperations();
            }
            case 2: {
                return this.getPaymentOperations();
            }
            case 4: {
                return this.getTransferOperations();
            }
            // TODO: Add exchange parsing
            case 7: {
                return this.getExchangeOperations();
            }
            case 11: {
                return this.getMassTransferOperations();
            }
            case 16: {
                return this.getInvokeScriptOperations();
            }
        }
    }


    private getGenesisOperations(): Promise<Array<IOperation>> {
        const body = this.body as IGenesisTransaction;
        return Promise.resolve([
            Operation.create(0, body.recipient, body.amount)
        ]);
    }

    private async getPaymentOperations(): Promise<Array<IOperation>> {
        const body = this.body as IGenesisTransaction & { sender: string };
        return [
            // Sending amount
            Operation.create(0, body.sender, -body.amount),
            Operation.create(1, body.recipient, body.amount),
            Operation.create(2, body.recipient, body.amount),

            // Fee for sender
            // {
            //     operation_identifier: {
            //         index: 2
            //     },
            //     type: OperationTypes.Transfer,
            //     status: OperationStatusValues.Success,
            //     account: new Account(body.sender).getIdentifier(),
            //     amount: new Amount(-1 * Number(body.fee)).getObject()
            // },
            // Fee for block producer (Moved to tx level)
            // {
            //     operation_identifier: {
            //         index: 3
            //     },
            //     type: OperationTypes.Transfer,
            //     status: OperationStatusValues.Success,
            //     account: new Account(blockGenerator).getIdentifier(),
            //     amount: new Amount(body.fee)
            // }
        ]
    }

    private getTransferOperations(): Promise<Array<IOperation>> {
        const body = this.body as IApiTransaction & ITransferTransaction & WithSenderAddress;
        if (body.assetId !== null) return Promise.resolve([]);
        const senderAddress = body.sender ? body.sender : address(body.senderPublicKey, CHAIN_ID);
        return Promise.resolve([
            Operation.create(0, body.recipient, body.amount),
            Operation.create(1, senderAddress, -body.amount)
        ]);
    }

    // TODO: Implement properly
    private getExchangeOperations(): Promise<Array<IOperation>> {
        // const body = this.body as IApiTransaction & IExchangeTransaction;
        return Promise.resolve([]);
    }

    // TODO: Implement properly
    private async getInvokeScriptOperations(): Promise<Array<IOperation>> {
        const body = this.body as IApiTransaction & IInvokeScriptTransaction & WithSenderAddress;
        const result: Array<IOperation> = [];
        let idIndex = 0;
        body.payment.forEach(payment => {
            if (payment.assetId !== null) return;
            result.push(
                Operation.create(idIndex++, body.sender, -payment.amount),
                Operation.create(idIndex++, body.dApp, payment.amount)
            );
        });
        const callResult = await apiCall(`${API_BASE}/debug/stateChanges/info/${body.id}`);
        callResult.stateChanges.transfers.forEach((transfer: { address: string, asset: string | null, amount: number }) => {
            if (transfer.asset !== null) return;
            result.push(
                Operation.create(idIndex, transfer.address, transfer.amount),
                Operation.create(idIndex, body.dApp, -transfer.amount),
            );
        });
        return Promise.resolve(result);
    }

    private getMassTransferOperations(): Promise<Array<IOperation>> {
        const body = this.body as IApiTransaction & IMassTransferTransaction & WithSenderAddress;
        if (body.assetId !== null) return Promise.resolve([]);
        let operationId = 0;
        const resultArray: Array<IOperation> = [];
        body.transfers.forEach((transfer) => {
            resultArray.push(
                Operation.create(operationId++, transfer.recipient, transfer.amount),
                Operation.create(operationId++, body.sender, -transfer.amount)
            )
        });
        return Promise.resolve(resultArray);
    }

    private async getRewardWithFeesOperations(): Promise<Array<IOperation>> {
        const result: Array<IOperation> = [];
        const blockGenerator = await this.block.getGenerator();
        if (this.block.getHeight() >= NG_ACTIVATION_HEIGHT) {
            const prevBlock = await new Block(this.block.getHeight() - 1).fetch();
            result.push(
                Operation.create(0, blockGenerator, (prevBlock.getBody().totalFee * 0.6)),
                Operation.create(1, blockGenerator, (this.block.getBody().totalFee * 0.4))
            );
        } else {
            result.push(Operation.create(0, blockGenerator, this.block.getBody().totalFee))
        }
        if (this.block.getHeight() >= BLOCK_REWARD_ACTIVATION_HEIGHT) {
            result.push(Operation.create(2, blockGenerator, this.block.getBody().reward))
        }
        return Promise.resolve(result);
    }

    getIdentifier() {
        return {
            hash: this.hash
        }
    }

    getHeight() {
        return this.body.height;
    }

    getBody() {
        return this.body;
    }
}