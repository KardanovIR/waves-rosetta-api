import {API_BASE} from "../secrets/secrets";
import {ErrorCodes, ErrorResponse} from "./ErrorResponse";
import {apiCall} from "../utils/utils";

export interface IBlockIdentifier {
    index?: number,
    hash?: string
}

export interface IBlock {
    blocksize: number,
    reward: number,
    signature: string,
    fee: number,
    generator: string,
    transactions: Array<any>,
    version: number,
    reference: string,
    features: number[],
    totalFee: number,
    "nxt-consensus": {
        "base-target": number,
        "generation-signature": string
    },
    id?: string,
    desiredReward: number,
    transactionCount: number,
    timestamp: number,
    height: number
}

export class Block {

    private readonly height: number;
    private data: IBlock;

    constructor(height: number) {
        this.height = height;
    }

    getHeight(): number {
        return this.height;
    }

    async getHash() {
        await this.fetch();
        return this.data.hasOwnProperty('id') ? this.data.id : this.data.signature;
    }

    async getTimestamp(): Promise<number> {
        await this.fetch();
        return this.data.timestamp;
    }

    getBody() {
        return this.data;
    }

    async getIdentifier(): Promise<IBlockIdentifier> {
        const blockHash = await this.getHash();
        return {
            index: this.getHeight(),
            hash: blockHash
        };
    }

    async fetch(): Promise<Block> {
        if (!this.data) {
            this.data = await apiCall(`${API_BASE}/blocks/headers/at/${this.height}`);
        }
        return this;
    }

    static async createFromIdentifier(blockIdentifier: IBlockIdentifier) {
        let block: Block;
        if (blockIdentifier.index) {
            block = new this(blockIdentifier.index);
        } else if (blockIdentifier.hash) {
            try {
                const blockHeight = await apiCall(`${API_BASE}/blocks/height/${blockIdentifier.hash}`);
                block = new this(blockHeight.height);
            } catch (e) {
                throw new ErrorResponse(ErrorCodes.BlockDoesNotExist, e.message);
            }
        } else {
            throw new ErrorResponse(ErrorCodes.BlockDoesNotExist, `Block with provided details does not exist`);
        }
        await block.fetch();
        if (blockIdentifier.hash && await block.getHash() !== blockIdentifier.hash)
            throw new ErrorResponse(ErrorCodes.BlockHashAndHeightNotEqual, `Block hash and index are different`);
        return block;
    }

    async getTransactions() {
        const blockWithTxs = await apiCall(`${API_BASE}/blocks/at/${this.height}`);
        return blockWithTxs.transactions;
    }

    async getGenerator() {
        await this.fetch();
        return this.data.generator;
    }
}