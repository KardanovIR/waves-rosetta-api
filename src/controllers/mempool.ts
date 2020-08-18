"use strict";

import {NextFunction, Request, Response, Router} from "express";
import {Network} from "../types/Network";
import {Transaction} from "../types/Transaction";
import {ITransaction, WithId} from "@waves/waves-transactions";

const MempoolController = Router();

const getBalance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // check correctness of network identifier
        const network = Network.createFromIdentifier(req.body.network_identifier);
        const mempoolTxs = await network.getMempoolTxHashes();
        res.json({
            transaction_identifiers: mempoolTxs
        });
    } catch (e) {
        next(e);
    }
};

const getTransactionInMempool = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const network = Network.createFromIdentifier(req.body.network_identifier);
        const mempoolTxs = await network.getMempoolTxs();

        const needed = mempoolTxs.find((tx: ITransaction & WithId) => {
            return tx.id === req.body.transaction_identifier.hash
        })

        const tx = new Transaction({...needed, height: 0});

        res.json({
            transaction: {
                transaction_identifier: tx.getIdentifier(),
                operations: await tx.getOperations()
            }
        })
    } catch (e) {
        next(e);
    }
}


MempoolController.post('/', getBalance);
MempoolController.post('/transaction', getTransactionInMempool);

export default MempoolController;