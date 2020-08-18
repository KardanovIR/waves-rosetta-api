import axios from "axios";
import {logger} from "../logger/WinstonLogger";
import {ErrorCodes, ErrorResponse} from "../types/ErrorResponse";

export const apiCall = async (url: string) => {
    logger.verbose(`Making request to url: ${url}`);
    try{
        const axiosResult = await axios.get(url);
        return axiosResult.data;
    }catch (e){
        logger.error(`Error during API call for ${url}`, e);
        throw new ErrorResponse(ErrorCodes.ApiCallError, `Error during API call for ${url}`);
    }
}