import {API_BASE} from "../secrets/secrets";
import {Block} from "./Block";
import {ErrorCodes, ErrorResponse} from "./ErrorResponse";
import {WavesCurrencyDetails} from "./WavesCurrencyDetails";
import {apiCall} from "../utils/utils";

export interface IAccountIdentifier {
    address: string
}


export class Account {

    private readonly address: string;

    constructor(address: string) {
        this.address = address;
    }

    getAddress(): string {
        return this.address;
    }

    async getBalance(block: Block): Promise<number> {
        const balancesHistory = await apiCall(`${API_BASE}/debug/balances/history/${this.address}`)  as Array<{ height: number, balance: number }>;
        const oldestBlock = balancesHistory[balancesHistory.length - 1].height;
        const balanceAtBlock = balancesHistory.find((element) => element.height === block.getHeight());
        if (balanceAtBlock === undefined)
            throw new ErrorResponse(ErrorCodes.BalanceAtOldBlock, `Can't fetch balance for an old block, the oldest possible is ${oldestBlock}`)
        return balanceAtBlock.balance;
    }

    async getBalanceData(block: Block) {
        const balanceValue = await this.getBalance(block);
        const blockDetails = await block.getIdentifier();
        return {
            block_identifier: blockDetails,
            balances: [
                {
                    value: balanceValue.toString(),
                    currency: {
                        symbol: WavesCurrencyDetails.symbol,
                        decimals: WavesCurrencyDetails.decimals,
                        metadata: {
                            // "Issuer": "Satoshi"
                        }
                    },
                    metadata: {}
                }
            ],
            // TODO: add coins identifier
            // "coins": [],
            metadata: {
                // "sequence_number": 23
            }
        }
    }

    static createFromIdentifier(accountIdentifier: IAccountIdentifier) {
        return new this(accountIdentifier.address);
    }

    getIdentifier(): IAccountIdentifier {
        return {
            address: this.address
        }
    }
}