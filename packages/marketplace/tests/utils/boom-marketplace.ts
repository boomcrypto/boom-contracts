import {Tx, types} from "https://deno.land/x/clarinet@v0.31.1/index.ts";

const CONTRACT_NAME = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.boom-market' as const;
const MOCK_TRADABLE_TRAIT = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.mock-tradable-trait' as const;

type ContractFun = 'list-asset' | 'get-listing' | 'set-listings-frozen' | 'unlist-asset' | 'purchase-asset';

const call = (fun: ContractFun, args: Array<string>, sender: string): Tx => {
    return Tx.contractCall(CONTRACT_NAME, fun, args, sender)
}


type ListingOptions = {
    address: string;
    id: number;
};

type ListAssetOptions = ListingOptions & {
    price?: number;
    commission?: number,
    sender?: string,
};

// Omit<ListAssetOptions, 'price' | 'commission' | 'sender'>


type ListingFrozenOptions = {
    shouldFrozen: boolean;
    sender: string,
}


const BoomMarketPlace = class {
    static listAsset = ({address, id, price = 1_000_000, commission = 1_000, sender}: ListAssetOptions): Tx =>
        call('list-asset', [
                types.principal(MOCK_TRADABLE_TRAIT),
                types.uint(id),
                types.uint(price),
                types.uint(commission)
            ],
            sender ?? address)

    static setListingsFrozen = ({sender, shouldFrozen}: ListingFrozenOptions): Tx =>
        call(
            'set-listings-frozen',
            [types.bool(shouldFrozen)],
            sender
        )


    static unlistAsset = ({address, id}: ListingOptions): Tx =>
        call(
            'unlist-asset',
            [
                types.principal(MOCK_TRADABLE_TRAIT),
                types.uint(id)
            ],
            address
        )


    static getListing = ({address, id}: ListingOptions): Tx =>
        call(
            'get-listing',
            [
                types.principal(MOCK_TRADABLE_TRAIT),
                types.uint(id)
            ],
            address
        )

    static purchaseAsset = ({address, id}: ListingOptions): Tx =>
        call(
            'purchase-asset',
            [
                types.principal(MOCK_TRADABLE_TRAIT),
                types.uint(id)
            ],
            address
        )


}

export default BoomMarketPlace;


