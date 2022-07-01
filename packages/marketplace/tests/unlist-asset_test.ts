import {Clarinet} from "https://deno.land/x/clarinet@v0.31.1/index.ts";
import BoomMarketPlace from "./utils/boom-marketplace.ts";
import MockTradableContract from "./utils/mock-tradable-contract.ts";

Clarinet.test({
    name: 'Unlist asset, success',
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get('wallet_1')!;
        const TOKEN_ID = 10;

        // Mint TOKEN_ID to wallet_1.
        chain.mineBlock(
            BoomMarketPlace.mintAndListNewAsset({
                address: wallet_1.address,
                id: TOKEN_ID,
            })
        )

        const block = chain.mineBlock([
            BoomMarketPlace.unlistAsset({
                address: wallet_1.address,
                id: TOKEN_ID
            }),
            BoomMarketPlace.getListing({address: wallet_1.address, id: TOKEN_ID})
        ]);

        block.receipts[0].result.expectOk().expectBool(true);
        // err-tradable-not-found u5
        block.receipts[1].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.tradableNotFound);
    }
})

Clarinet.test({
    name: 'Not Allowed Unlisting',
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get('wallet_1')!;
        const wallet_2 = accounts.get('wallet_2')!;
        const TOKEN_ID = 33;

        // Mint TOKEN_ID to wallet_1.
        chain.mineBlock(
            BoomMarketPlace.mintAndListNewAsset({
                address: wallet_1.address,
                id: TOKEN_ID,
            })
        )

        const block = chain.mineBlock([
            BoomMarketPlace.unlistAsset({
                address: wallet_2.address,
                id: TOKEN_ID,
            })
        ]);

        // err-not-allowed u3
        block.receipts[0].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.notAllowed);
    }
})

Clarinet.test({
    name: 'Unlist not-found Asset',
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get('wallet_1')!;

        const block = chain.mineBlock([
            BoomMarketPlace.unlistAsset({
                address: wallet_1.address,
                id: 10
            })
        ]);

        // err-tradable-not-found u5
        block.receipts[0].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.tradableNotFound);
    }
})

Clarinet.test({
    name: 'Unlist asset, transfer should fail',
    fn: (chain, accounts) => {
        const owner = accounts.get('wallet_1')!;
        const TOKEN_ID = 10;

        // Mint TOKEN_ID to wallet_1.
        chain.mineBlock([
            ...BoomMarketPlace.mintAndListNewAsset({
                address: owner.address,
                id: TOKEN_ID,
            }),
            MockTradableContract.setFailing({
                fail: true,
                sender: owner.address
            }),
        ])

        const block = chain.mineBlock([
            BoomMarketPlace.unlistAsset({
                address: owner.address,
                id: TOKEN_ID
            }),
        ]);

        block.receipts[0].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.transferFailed);
    }
})