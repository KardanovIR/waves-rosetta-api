"use strict";

import {NextFunction, Request, Response, Router} from "express";
import {Network} from "../types/Network";
import {CurveTypesEnum, ISignature, PublicKey, SignatureType} from "../types/Cryptography";
import {IOperation, OperationTypes} from "../types/Operation";
import {WavesCurrencyDetails} from "../types/WavesCurrencyDetails";
import {ErrorCodes, ErrorResponse} from "../types/ErrorResponse";
import {broadcast, ITransferTransaction, transfer} from "@waves/waves-transactions";
import {binary} from '@waves/marshall'
import {address, base16Decode, base16Encode, base58Encode, verifySignature} from "@waves/ts-lib-crypto";
import {IApiTransaction, Transaction} from "../types/Transaction";
import {API_BASE, CHAIN_ID} from "../secrets/secrets";
import {apiCall} from "../utils/utils";

const ConstructionController = Router();

const deriveAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // check correctness of network identifier
        const network = Network.createFromIdentifier(req.body.network_identifier);
        const publicKey = new PublicKey(req.body.public_key.hex_bytes, req.body.public_key.curve_type);
        res.json({
            address: publicKey.deriveAddress()
        });
    } catch (e) {
        next(e);
    }
};

const preprocess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // check correctness of network identifier
        const network = Network.createFromIdentifier(req.body.network_identifier);
        res.json({
            options: {}
        });
    } catch (e) {
        next(e);
    }
};

const getMetadata = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // check correctness of network identifier
        const network = Network.createFromIdentifier(req.body.network_identifier);
        res.json({
            metadata: {}
        });
    } catch (e) {
        next(e);
    }
};

const processPayloads = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // check correctness of network identifier
        const network = Network.createFromIdentifier(req.body.network_identifier);
        const operationForTransfer = req.body.operations.find((operation: IOperation) => {
            return operation.type === OperationTypes.Transfer
                && operation.amount.currency.symbol === WavesCurrencyDetails.symbol
                && Number(operation.amount.value) > 0
                && operation.amount.currency.decimals === WavesCurrencyDetails.decimals
                && operation.metadata && operation.metadata.public_key && operation.metadata.public_key.hex_bytes
                && operation.metadata.public_key.curve_type === CurveTypesEnum.ED25519
        }) as IOperation;

        if (!operationForTransfer) {
            throw new ErrorResponse(ErrorCodes.BadOperationForConstruction, `Cant find operation to build tx, check type, symbol, decimals or value`);
        }

        const publicKey = new PublicKey(operationForTransfer.metadata.public_key.hex_bytes, operationForTransfer.metadata.public_key.curve_type);

        const transferTx = transfer({
            recipient: operationForTransfer.account.address,
            amount: operationForTransfer.amount.value,
            senderPublicKey: publicKey.toBase58()
        });

        const txBytes = binary.serializeTx(transferTx);

        res.json({
            unsigned_transaction: base16Encode(txBytes),
            payloads: [
                {
                    address: operationForTransfer.account.address,
                    hex_bytes: base16Encode(txBytes),
                    signature_type: SignatureType.ED25519
                }
            ]
        });
    } catch (e) {
        next(e);
    }

};


const parseTx = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // check correctness of network identifier
        const network = Network.createFromIdentifier(req.body.network_identifier);
        const signed = req.body.signed;
        const transactionHex = req.body.transaction;
        let sender, tx, transactionBody;
        if (!signed) {
            transactionBody = binary.parseTx(base16Decode(transactionHex)) as IApiTransaction;
        } else {
            transactionBody = JSON.parse(req.body.transaction) as IApiTransaction;
            //TODO: Add signatures verification
        }
        sender = address(transactionBody.senderPublicKey, CHAIN_ID);
        tx = new Transaction(transactionBody);

        res.json({
            operations: await tx.getOperations(),
            signers: signed ? [sender] : []
        });

    } catch (e) {
        next(e);
    }
};

const combineTxWithSignature = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // check correctness of network identifier
        const network = Network.createFromIdentifier(req.body.network_identifier);
        const transactionHex = req.body.unsigned_transaction;
        const transactionBody = binary.parseTx(base16Decode(transactionHex)) as ITransferTransaction;
        transactionBody.timestamp = Number(transactionBody.timestamp);
        const transferTx = transfer(transactionBody);

        transferTx.proofs = req.body.signatures.map((signature: ISignature) => {
            if (signature.signature_type !== SignatureType.ED25519)
                throw new ErrorResponse(ErrorCodes.UnsupportedSignatureType, `Only ${SignatureType.ED25519} signature type is supported`);
            if (signature.signing_payload.signature_type !== SignatureType.ED25519)
                throw new ErrorResponse(ErrorCodes.UnsupportedSignatureType, `Only ${SignatureType.ED25519} signature type is supported`);

            if (signature.hex_bytes.indexOf('0x') === 0) {
                signature.hex_bytes = signature.hex_bytes.replace('0x', '');
            }
            return base58Encode(base16Decode(signature.hex_bytes));
        });

        res.json({
            "signed_transaction": JSON.stringify(transferTx)
        });
    } catch (e) {
        next(e);
    }
};

const getHash = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // check correctness of network identifier
        const network = Network.createFromIdentifier(req.body.network_identifier);
        const transactionBody = req.body.signed_transaction;
        const tx = JSON.parse(transactionBody);
        const transaction = new Transaction(tx);

        res.json({
            "transaction_identifier": transaction.getIdentifier()
        });
    } catch (e) {
        next(e);
    }
};

const submitTx = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // check correctness of network identifier
        const network = Network.createFromIdentifier(req.body.network_identifier);
        const transactionBody = req.body.signed_transaction;
        const tx = JSON.parse(transactionBody);
        const transaction = new Transaction(tx);

        await broadcast(tx, API_BASE);
        res.json({
            "transaction_identifier": transaction.getIdentifier()
        });
    } catch (e) {
        next(e);
    }
};

ConstructionController.post('/derive', deriveAddress);
ConstructionController.post('/preprocess', preprocess);
ConstructionController.post('/metadata', getMetadata);
ConstructionController.post('/payloads', processPayloads);
ConstructionController.post('/parse', parseTx);
ConstructionController.post('/combine', combineTxWithSignature);
ConstructionController.post('/hash', getHash);
ConstructionController.post('/submit', submitTx);

export default ConstructionController;