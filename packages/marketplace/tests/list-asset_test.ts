import {Chain, Clarinet} from "https://deno.land/x/clarinet@v0.31.1/index.ts";
import TradableTraitContractMock from "./utils/mock-tradable-contract.ts";
import MockTradableContract from "./utils/mock-tradable-contract.ts";
import BoomMarketPlace from "./utils/boom-marketplace.ts";

Clarinet.test({
    name: "List asset, success",
    fn: (chain, accounts) => {
        const owner = accounts.get("wallet_1")!;

        // Mint token u1 to owner.
        const block = chain.mineBlock(
            BoomMarketPlace.mintAndListNewAsset({
                address: owner.address, id: 23,
            })
        );

        block.receipts[1].result
            .expectOk()
            .expectBool(true);
    }
})

Clarinet.test({
    name: "List asset, commission too low",
    fn: (chain, accounts) => {
        const owner = accounts.get("wallet_1")!;

        // Given low commission.
        const block = chain.mineBlock(
            BoomMarketPlace.mintAndListNewAsset({
                address: owner.address,
                id: 23,
                price: 1_000_000,
                commission: 200,
            })
        );
        // err-commission-or-price-too-low u6
        block.receipts[1].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.commissionOrPriceTooLow);
    }
})

Clarinet.test({
    name: "List asset, price too low",
    fn: (chain: Chain, accounts) => {
        const owner = accounts.get("wallet_1")!;

        const block = chain.mineBlock(
            BoomMarketPlace.mintAndListNewAsset({
                address: owner.address,
                id: 23,
                commission: 249,
            })
        );

        // err-commission-or-price-too-low u6
        block.receipts[1].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.commissionOrPriceTooLow);
    }
})

Clarinet.test({
    name: "List asset, not allowed",
    fn: (chain, accounts) => {
        const owner = accounts.get("wallet_1")!;
        const scammer = accounts.get("wallet_2")!;

        // Mint token to wallet_1.
        chain.mineBlock([
            TradableTraitContractMock.mint({address: owner.address, id: 1})
        ]);

        // Given listing asset by non-owner principal.
        const block = chain.mineBlock([
            BoomMarketPlace.listAsset({
                address: scammer.address,
                id: 1,
            })
        ]);

        // err-not-allowed u3
        block.receipts[0].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.notAllowed);
    }
})

Clarinet.test({
    name: 'List not-found asset',
    fn: (chain, accounts) => {
        const owner = accounts.get("wallet_1")!;

        const block = chain.mineBlock([
            BoomMarketPlace.listAsset({
                address: owner.address,
                id: 1,
            })
        ]);

        // err-tradable-not-found u5
        block.receipts[0].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.tradableNotFound)
    }
})

Clarinet.test({
    name: "List asset, duplicate entry",
    ignore: true,
    fn: (chain, accounts) => {
        const deployer = accounts.get("deployer")!;
        const wallet_1 = accounts.get("wallet_1")!;

        // Mint token u1 to wallet_1.
        chain.mineBlock([
            TradableTraitContractMock.mint({address: wallet_1.address, id: 1})
        ]);

        chain.mineBlock([
            BoomMarketPlace.listAsset({
                address: wallet_1.address,
                id: 1,
            })
        ]);

        // TODO: Since nft is transferred into escrow in .boom-market place contract,
        //       we can never hit the duplicate entry error, unless we call it explicitly
        //       with the .boom-market address.
        const block = chain.mineBlock([
            BoomMarketPlace.listAsset({
                address: `${deployer.address}.boom-market`,
                id: 1,
                // TODO: given the contract address causing this to fail to parse the principal.
                sender: wallet_1.address
            })
        ]);

        // err-duplicate-entry u4
        block.receipts[0].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.duplicateEntry)
    }
})

Clarinet.test({
    name: "List asset while listing is frozen",
    fn: (chain, accounts) => {
        const deployer = accounts.get("deployer")!;
        const owner = accounts.get("wallet_1")!;

        chain.mineBlock([
            BoomMarketPlace.setListingsFrozen({
                sender: deployer.address,
                shouldFrozen: true,
            })
        ]);

        // Try listing, given listings is frozen
        const block = chain.mineBlock([
            BoomMarketPlace.listAsset({
                address: owner.address,
                id: 1,
            })
        ]);

        // err-listings-frozen u7
        block.receipts[0].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.listingsFrozen);
    }
})

Clarinet.test({
    name: "List asset, transfer should fail",
    fn: (chain, accounts) => {
        const owner = accounts.get("wallet_1")!;
        const TOKEN_ID = 545

        const block = chain.mineBlock([
            MockTradableContract.setFailing({
                fail: true,
                sender: owner.address
            }),
            ...BoomMarketPlace.mintAndListNewAsset({
                address: owner.address,
                id: TOKEN_ID,
            }),
        ])

        block.receipts[2].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.transferFailed);
    }
})