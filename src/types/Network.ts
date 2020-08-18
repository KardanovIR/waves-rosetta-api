import {ITransaction, nodeInteraction, WithId} from '@waves/waves-transactions';
import {Block} from "./Block";
import {API_BASE, REFERENCE_API_BASE} from "../secrets/secrets";
import {ErrorCodes, ErrorResponse} from "./ErrorResponse";
import {apiCall} from "../utils/utils";
import {IApiTransaction} from "Transaction";


export interface INetworkIdentifier {
    blockchain: string,
    network: NetworkTypesEnum,
    metadata?: any
}

export enum NetworkTypesEnum {
    Mainnet = 'mainnet',
    Testnet = 'testnet',
    Stagenet = 'stagenet',
    Devnet = 'devnet',
    Local = 'local'
}

export class Network {

    private readonly network: NetworkTypesEnum;

    private static Blockchain = 'Waves';
    public static SupportedTypes = [NetworkTypesEnum.Mainnet, NetworkTypesEnum.Testnet, NetworkTypesEnum.Stagenet];
    public static ApiBase = API_BASE;
    public static ReferenceApiBase = REFERENCE_API_BASE;

    constructor(network: NetworkTypesEnum) {
        this.network = network;

    }

    static getSupportedChains(): Array<INetworkIdentifier> {
        return Network.SupportedTypes.map(chain => new Network(chain).getIdentifier())
    }

    static typeIsSupported(networkType: NetworkTypesEnum): boolean {
        return Network.SupportedTypes
            .indexOf(networkType) !== -1;
    }

    static createFromIdentifier(identifier: INetworkIdentifier): Network {
        if (identifier.blockchain.toLowerCase() !== Network.Blockchain.toLowerCase())
            throw new ErrorResponse(ErrorCodes.UnknownBlockchainIdentifier, `Invalid blockchain identifier`);
        if (!Network.typeIsSupported(identifier.network))
            throw new ErrorResponse(ErrorCodes.UnknownNetworkType, `Invalid network type, these are supported: ${Network.SupportedTypes.join(', ')}`);
        return new this(identifier.network);
    }

    getIdentifier(): INetworkIdentifier {
        return {
            blockchain: Network.Blockchain,
            network: this.network
        }
    }

    getApiBase(): string {
        return Network.ApiBase;
    }

    getReferenceApiBase(): string {
        return Network.ReferenceApiBase;
    }

    async getCurrentHeight(): Promise<number> {
        return await nodeInteraction.currentHeight(this.getApiBase());
    }

    async getReferenceNodeCurrentHeight(): Promise<number> {
        return nodeInteraction.currentHeight(this.getReferenceApiBase());
    }

    async getCurrentBlock(): Promise<Block> {
        const currentHeight = await this.getCurrentHeight();
        const currentBlock = new Block(currentHeight);
        await currentBlock.fetch();
        return currentBlock;
    }

    async getNodeVersion(): Promise<string> {
        const nodeVersion = await apiCall(`${API_BASE}/node/version`);
        return nodeVersion.version;
    }

    async getMempoolTxs(): Promise<Array<ITransaction & WithId>> {
        return await apiCall(`${API_BASE}/transactions/unconfirmed`) as Array<ITransaction & WithId>;
    }

    async getMempoolTxHashes(): Promise<Array<{ hash: string }>> {
        const txs = await this.getMempoolTxs();
        return txs.map(tx => {
            return {hash: tx.id}
        })
    }
}