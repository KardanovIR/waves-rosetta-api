import {address, base16Decode, base58Encode, buildAddress, isPublicKey, publicKey} from '@waves/ts-lib-crypto'
import {CHAIN_ID} from "../secrets/secrets";
import {ErrorCodes, ErrorResponse} from "./ErrorResponse";

export enum CurveTypesEnum {
    SECP256K1 = 'secp256k1',
    ED25519 = 'edwards25519',
}

export enum SignatureType {
    ECDSA = 'ecdsa',
    ECDSA_RECOVERY = 'ecdsa_recovery',
    ED25519 = 'ed25519'
}

export interface IPublicKey {
    hex_bytes: string,
    curve_type: CurveTypesEnum
}

export interface ISigningPayload {
    address: string,
    hex_bytes: string,
    signature_type?: SignatureType
}

export interface ISignature {
    signing_payload: ISigningPayload,
    public_key: IPublicKey,
    signature_type: SignatureType,
    hex_bytes: string,
}

export class PublicKey {

    private readonly hexBytes: string;
    private readonly curveType: CurveTypesEnum;

    constructor(hexBytes: string, curveType: CurveTypesEnum) {
        if (hexBytes.indexOf('0x') === 0) {
            hexBytes = hexBytes.replace('0x', '');
        }
        this.hexBytes = hexBytes;
        if (curveType !== CurveTypesEnum.ED25519) {
            throw new ErrorResponse(ErrorCodes.CurveIsNotSupported, `Only ${CurveTypesEnum.ED25519} curve is supported`);
        }
        this.curveType = curveType;
    }

    deriveAddress() {
        const publicKeyBytes = base16Decode(this.hexBytes);
        return base58Encode(buildAddress(publicKeyBytes, CHAIN_ID));
    }

    toBase58() {
        return base58Encode(base16Decode(this.hexBytes));
    }
}