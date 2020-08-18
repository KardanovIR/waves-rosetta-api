"use strict";

import {NextFunction, Request, Response, Router} from "express";
import {Network} from "../types/Network";
import {Block} from "../types/Block";
import {Account} from "../types/Account";

const AccountController = Router();

const getBalance = async (req: Request, res: Response, next: NextFunction) => {
    try{
        // check correctness of network identifier
        const network = Network.createFromIdentifier(req.body.network_identifier);
        const block = await Block.createFromIdentifier(req.body.block_identifier);
        const account = Account.createFromIdentifier(req.body.account_identifier)
        const balanceData = await account.getBalanceData(block);
        res.json(balanceData);
    } catch (e) {
        next(e);
    }
};

AccountController.post('/balance', getBalance);

export default AccountController;