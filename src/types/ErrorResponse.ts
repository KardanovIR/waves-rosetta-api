export enum ErrorCodes {
    UnknownBlockchainIdentifier = 100,
    UnknownNetworkType = 101,
    BlockHashAndHeightNotEqual = 102,
    BlockDoesNotExist = 102,
    BalanceAtOldBlock = 103,
    TxDoesNotExistInBlock = 104,
    CurveIsNotSupported = 105,
    BadOperationForConstruction = 106,
    UnsupportedSignatureType = 107,
    ApiCallError = 1000,
    UnknownError = 1001,
}

export class ErrorResponse {

    private code: ErrorCodes;
    private message: string;
    private details: any;
    private retriable: boolean;

    constructor(code: ErrorCodes, message: string, details?: any, retriable: boolean = true) {
        this.code = code;
        this.message = message;
        this.details = details;
        this.retriable = retriable;
    }

    getJson() {
        return {
            code: this.code,
            message: this.message,
            details: this.details,
            retriable: this.retriable
        }
    }
}