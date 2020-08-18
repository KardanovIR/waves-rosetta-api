"use strict";

import {NextFunction, Request, Response, Router} from "express";
import {logger} from "../logger/WinstonLogger";
import {Network} from "../types/Network";
import {Block} from "../types/Block";
import {OperationStatuses, OperationTypes} from "../types/Operation";
import {ErrorCodes} from "../types/ErrorResponse";

const {version} = require('../../package.json');
const {info} = require('../../resotta-api.json');


const NetworkController = Router();

const listNetworks = (req: Request, res: Response, next: NextFunction) => {
    try {
        res.json({
            network_identifiers: Network.getSupportedChains()
        });
    } catch (e) {
        next(e);
    }
};

const getNetworkStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const network = Network.createFromIdentifier(req.body.network_identifier);
        const currentBlock = await network.getCurrentBlock();
        const currentBlockIdentifier = await currentBlock.getIdentifier();
        const currentBlockTimestamp = await currentBlock.getTimestamp();

        let oldestBlock;
        let oldestBlockIdentifier;
        if (currentBlock.getHeight() > 1) {
            oldestBlock = new Block(currentBlock.getHeight() - 1);
            await oldestBlock.fetch();
        } else {
            oldestBlock = currentBlock;
        }
        oldestBlockIdentifier = await oldestBlock.getIdentifier();


        const genesisBlock = new Block(1);
        await genesisBlock.fetch();
        const genesisBlockIdentifier = await genesisBlock.getIdentifier();

        const referenceNodeHeight = await network.getReferenceNodeCurrentHeight();
        const syncStage = Math.abs(referenceNodeHeight - currentBlock.getHeight()) > 3 ? 'header sync' : 'synced';

        const statusData = {
            current_block_identifier: currentBlockIdentifier,
            current_block_timestamp: currentBlockTimestamp,
            genesis_block_identifier: genesisBlockIdentifier,
            oldest_block_identifier: oldestBlockIdentifier,
            sync_status: {
                current_index: currentBlock.getHeight(),
                target_index: referenceNodeHeight,
                stage: syncStage
            },
        }
        res.json(statusData);
    } catch (e) {
        next(e);
    }
}

const getNetworkOptions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const network = Network.createFromIdentifier(req.body.network_identifier);
        const nodeVersion = await network.getNodeVersion();

        const errors = [];

        for (let item in ErrorCodes) {
            if (!Number(item)) return;
            errors.push({
                code: Number(item),
                message: ErrorCodes[item],
                retriable: true
            })
        }


        const options = {
            version: {
                rosetta_version: info.version,
                node_version: nodeVersion,
                middleware_version: version,
                metadata: {}
            },
            allow: {
                operation_statuses: [
                    Object.values(OperationStatuses)
                ],
                operation_types: [
                    OperationTypes.Transfer
                ],
                errors: errors,
                historical_balance_lookup: false
            }
        }
        res.json(options);
    } catch (e) {
        next(e);
    }
}

NetworkController.post('/list', listNetworks);
NetworkController.post('/status', getNetworkStatus);
NetworkController.post('/options', getNetworkOptions);

export default NetworkController;