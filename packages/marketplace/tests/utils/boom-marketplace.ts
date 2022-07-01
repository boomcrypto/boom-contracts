import {Tx, types} from "https://deno.land/x/clarinet@v0.31.1/index.ts";
import MockTradableContract from "./mock-tradable-contract.ts";

const CONTRACT_NAME = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.boom-market' as const;
const MOCK_TRADABLE_TRAIT = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.mock-tradable-trait' as const;

type ContractFun =
    'list-asset'
    | 'get-listing'
    | 'set-listings-frozen'
    | 'unlist-asset'
    | 'purchase-asset'
    | 'set-royalty';

const call = (fun: ContractFun, args: Array<string>, sender: string): Tx => {
    return Tx.contractCall(CONTRACT_NAME, fun, args, sender)
}


export type ListingOptions = {
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
    static MINIMUM_PRICE = 1_000_000 as const;
    static MINIMUM_COMMISSION = 250 as const;

    static ErrorCodes = {
        paymentFailed: 1 as const,
        transferFailed: 2 as const,
        notAllowed: 3 as const,
        duplicateEntry: 4 as const,
        tradableNotFound: 5 as const,
        commissionOrPriceTooLow: 6 as const,
        listingsFrozen: 7 as const,
        commissionPaymentFailed: 8 as const,
        royaltyPaymentFailed: 9 as const,
    }

    static listAsset =
        ({
             address,
             id,
             price = BoomMarketPlace.MINIMUM_PRICE,
             commission = BoomMarketPlace.MINIMUM_COMMISSION,
             sender
         }: ListAssetOptions): Tx =>
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

    static mintAndListNewAsset = (
        {
            address,
            id,
            price = BoomMarketPlace.MINIMUM_PRICE,
            commission = BoomMarketPlace.MINIMUM_COMMISSION,
            sender
        }: ListAssetOptions
    ): Tx[] => {
        const tx = MockTradableContract.mint({address: address, id: id})

        const listingTx = BoomMarketPlace.listAsset({
            address: address,
            id: id,
            price,
            commission,
            sender
        });

        return [tx, listingTx];
    }

    static setRoyalty =
        ({
             royal,
             percent,
             sender
         }: { royal: string, percent: number, sender: string }) => {
            return call(
                'set-royalty',
                [
                    types.principal(MOCK_TRADABLE_TRAIT),
                    types.principal(royal),
                    types.uint(percent)
                ],
                sender
            )
        }

}

export default BoomMarketPlace;


