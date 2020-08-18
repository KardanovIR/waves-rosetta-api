import express, {NextFunction, Request, Response} from "express";
import compression from "compression";  // compresses requests
import bodyParser from "body-parser";
import {ENVIRONMENT} from './secrets/secrets';
// Controllers (route handlers)
import NetworkController from "./controllers/network";
import AccountController from "./controllers/account";
import {logger} from "./logger/WinstonLogger";
import MempoolController from "./controllers/mempool";
import BlockController from "./controllers/block";
import ConstructionController from "./controllers/construction";
import {ErrorCodes, ErrorResponse} from "./types/ErrorResponse";

// Create Express server
const app = express();

// Express configuration
app.set("port", process.env.PORT || 3000);
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use((req: Request, res: Response, next: NextFunction) => {
    logger.verbose(`Routing request for: ${req.url}`);
    logger.verbose(req.body);
    next();
});

/**
 * Primary app routes.
 */
app.use("/network", NetworkController);
app.use("/account", AccountController);
app.use("/mempool", MempoolController);
app.use("/block", BlockController);
app.use("/construction", ConstructionController);

app.use((err: ErrorResponse | any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ErrorResponse) {
        res.json(err.getJson());
    } else {
        res
            .status(500)
            .json({
                code: ErrorCodes.UnknownError,
                message: err.message,
                details: err,
                retriable: true
            });
    }
});

export default app;
