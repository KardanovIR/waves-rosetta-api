import {Account, IAccountIdentifier} from "./Account";
import {Amount, IAmount} from "./Amount";


export enum OperationTypes {
    Transfer = 'TRANSFER'
}

export enum OperationStatusValues {
    Success = 'SUCCESS'
}

export const OperationStatuses = {
    Success: {
        value: OperationStatusValues.Success,
        successful: true
    }
}


export interface IOperation {
    operation_identifier: {
        index: number
    },
    type: OperationTypes,
    status: OperationStatusValues,
    account: IAccountIdentifier,
    amount: IAmount,
    metadata?: any
}


export class Operation {

    private readonly identifierIndex: number;
    private readonly account: string;
    private readonly amount: number;
    private readonly type: OperationTypes;
    private readonly status: OperationStatusValues;


    constructor(identifierIndex: number, account: string, amount: number, type: OperationTypes = OperationTypes.Transfer, status: OperationStatusValues = OperationStatusValues.Success) {
        this.identifierIndex = identifierIndex;
        this.account = account;
        this.amount = amount;
        this.type = type;
        this.status = status;
    }

    static create(identifierIndex: number, account: string, amount: number | string, type: OperationTypes = OperationTypes.Transfer, status: OperationStatusValues = OperationStatusValues.Success):IOperation {
        return {
            operation_identifier: {
                index: identifierIndex
            },
            type: type,
            status: status,
            account: new Account(account).getIdentifier(),
            amount: new Amount(Number(amount)).getObject()
        }
    }
}