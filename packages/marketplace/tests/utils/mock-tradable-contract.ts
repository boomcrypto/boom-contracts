import {Tx, types} from "https://deno.land/x/clarinet@v0.31.1/index.ts";

const CONTRACT_NAME = 'mock-tradable-trait'

type RegisterOptions = {
    address: string;
    id: number;
};

type ContractFun = 'register' | 'get-owner'

const call = (funName: ContractFun, args: Array<string>, sender: string): Tx => {
    return Tx.contractCall(CONTRACT_NAME, funName, args, sender)
}

const MockTradableTraitContract = class {

    static register = ({address, id}: RegisterOptions): Tx => {
        return call('register', [types.uint(id), types.principal(address)], address)
    }

    static getOwner = (sender: string, id: number): Tx => {
        return call('get-owner', [types.uint(id)], sender);
    }
}

export default MockTradableTraitContract;





