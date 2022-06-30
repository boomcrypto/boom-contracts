import {Tx, types} from "https://deno.land/x/clarinet@v0.31.1/index.ts";

const CONTRACT_NAME = 'boom-market';

type ContractFun = 'list-asset';

const call = (fun: ContractFun, args: Array<string>, sender: string): Tx => {
    return Tx.contractCall(CONTRACT_NAME, fun, args, sender)
}

type ListAssetOptions = {
    address: string;
    id: number;
    price?: number;
    commission?: number,
    sender?: string,
}


const BoomMarketPlace = class {
    static listAsset = ({address, id, price = 1_000_000, commission = 1_000_00, sender}: ListAssetOptions): Tx => {
        return call('list-asset', [
                types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.mock-tradable-trait'),
                types.uint(id),
                types.uint(price),
                types.uint(commission)
            ],
            sender ?? address);
    }
}

export default BoomMarketPlace;


