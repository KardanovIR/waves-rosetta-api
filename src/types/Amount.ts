import {ICurrency, WavesCurrencyDetails} from "./WavesCurrencyDetails";

export interface IAmount {
    value: string,
    currency: ICurrency
}

export class Amount {
    private value: number | string;

    constructor(value: number | string) {
        this.value = value;
    }

    getObject() {
        return {
            value: this.value.toString(),
            currency: WavesCurrencyDetails,
            "metadata": {}
        }
    }
}