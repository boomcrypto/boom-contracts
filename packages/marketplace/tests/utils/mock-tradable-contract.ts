import {Tx, types} from "https://deno.land/x/clarinet@v0.31.1/index.ts";
import {ListingOptions} from "./boom-marketplace.ts";

const CONTRACT_NAME = 'mock-tradable-trait'

type ContractFun = 'mint' | 'get-owner'

const call = (funName: ContractFun, args: Array<string>, sender: string): Tx => {
    return Tx.contractCall(CONTRACT_NAME, funName, args, sender)
}

const MockTradableContract = class {

    static mint = ({address, id}: ListingOptions): Tx => {
        return call('mint', [types.uint(id), types.principal(address)], address)
    }

    static getOwner = ({address, id}: ListingOptions): Tx => {
        return call('get-owner', [types.uint(id)], address);
    }
}

export default MockTradableContract;





