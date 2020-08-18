"use strict";

import {NextFunction, Request, Response, Router} from "express";
import {Network} from "../types/Network";
import {Block} from "../types/Block";
import {IApiTransaction, Transaction} from "../types/Transaction";
import * as async from 'async';
import {ErrorCodes, ErrorResponse} from "../types/ErrorResponse";

const BlockController = Router();

const getBlock = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // check correctness of network identifier
        const network = Network.createFromIdentifier(req.body.network_identifier);
        const block = await Block.createFromIdentifier(req.body.block_identifier);
        let prevBlock;
        if (block.getHeight() > 1) {
            prevBlock = await (new Block(block.getHeight() - 1).fetch());
        } else {
            prevBlock = block;
        }

        const txs = await block.getTransactions();
        let txWithOperations: any = [];

        const tasks = txs.map((tx: IApiTransaction) => {
            return async (callback: Function) => {
                const transaction = new Transaction(tx, block);
                try {
                    const operations = await transaction.getOperations();
                    txWithOperations.push({
                        transaction_identifier: {
                            hash: transaction.getHash(),
                        },
                        operations: operations,
                        metadata: {}
                    });
                    callback(null);
                } catch (e) {
                    callback(e);
                }
            }
        });

        const blockTimestamp = await block.getTimestamp();
        const blockHash = await block.getHash();
        await async.parallelLimit(tasks, 2);

        const blockRewardTx = new Transaction({
            type: 0,
            timestamp: blockTimestamp,
            fee: 0,
            version: 0,
            id: blockHash,
            proofs: [],
            senderPublicKey: '',
            height: block.getHeight()
        }, block);

        txWithOperations = txWithOperations.concat(await blockRewardTx.getOperations())
            .filter((tx: any) => tx.operations && tx.operations.length > 0);

        const blockDetails = {
            "block": {
                block_identifier: await block.getIdentifier(),
                parent_block_identifier: await prevBlock.getIdentifier(),
                timestamp: await block.getTimestamp(),
                transactions: txWithOperations,
                metadata: {}
            }
        }
        res.json(blockDetails);
    } catch (e) {
        next(e);
    }

};

const getTransactionInBlock = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const network = Network.createFromIdentifier(req.body.network_identifier);
        const tx = await Transaction.createFromIdentifier(req.body.transaction_identifier);
        const block = await Block.createFromIdentifier(req.body.block_identifier);
        if (block.getHeight() !== tx.getHeight()) {
            throw new ErrorResponse(ErrorCodes.TxDoesNotExistInBlock, `Transaction does not exist in the block`);
        }
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

BlockController.post('/', getBlock);
BlockController.post('/transaction', getTransactionInBlock);

export default BlockController;