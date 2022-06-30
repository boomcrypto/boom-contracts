import {Clarinet} from "../../common/tests/deps.ts";
import TradableTraitContractMock from "./utils/mock-tradable-contract.ts";
import BoomMarketPlace from "./utils/boom-marketplace.ts";


Clarinet.test({
    name: "List asset, commission too low",
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get("wallet_1")!;

        // Register token u1 to wallet_1.
        const tx = TradableTraitContractMock.register({address: wallet_1.address, id: 1});
        chain.mineBlock([tx]);

        // Given low commission.
        const tx1 = BoomMarketPlace.listAsset({
            address: wallet_1.address,
            id: 1,
            price: 1_000_000,
            commission: 200,
        });

        const block = chain.mineBlock([tx1]);
        // err-commission-or-price-too-low u6
        block.receipts[0].result.expectErr().expectUint(6);
    }
})

Clarinet.test({
    name: "List asset, price too low",
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get("wallet_1")!;

        // Register token to wallet_1.
        const tx = TradableTraitContractMock.register({address: wallet_1.address, id: 1});
        chain.mineBlock([tx]);

        // Given low price for listing.
        const tx1 = BoomMarketPlace.listAsset({
            address: wallet_1.address,
            id: 1,
            price: 2000,
            commission: 1000,
        });

        const block = chain.mineBlock([tx1]);
        // err-commission-or-price-too-low u6
        block.receipts[0].result.expectErr().expectUint(6);
    }
})

Clarinet.test({
    name: "List asset, not allowed",
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get("wallet_1")!;
        const wallet_2 = accounts.get("wallet_2")!;

        // Register token to wallet_1.
        const tx = TradableTraitContractMock.register({address: wallet_1.address, id: 1});
        chain.mineBlock([tx]);

        // Given listing asset by non-owner principal.
        const tx1 = BoomMarketPlace.listAsset({
            address: wallet_2.address,
            id: 1,
        });
        const block = chain.mineBlock([tx1]);

        // err-not-allowed u3
        block.receipts[0].result.expectErr().expectUint(3);
    }
})

Clarinet.test({
    name: 'List not-found asset',
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get("wallet_1")!;
        const tx = BoomMarketPlace.listAsset({
            address: wallet_1.address,
            id: 1,
        })
        const block = chain.mineBlock([tx]);

        // err-tradable-not-found u5
        block.receipts[0].result.expectErr().expectUint(5)
    }
})


Clarinet.test({
    name: "List asset, duplicate entry",
    fn: (chain, accounts) => {
        const deployer = accounts.get("deployer")!;
        const wallet_1 = accounts.get("wallet_1")!;

        // Register token u1 to wallet_1.
        const tx = TradableTraitContractMock.register({address: wallet_1.address, id: 1});
        chain.mineBlock([tx]);

        const tx1 = BoomMarketPlace.listAsset({
            address: wallet_1.address,
            id: 1,
        });
        chain.mineBlock([tx1]);

        // TODO: Since nft is transferred into escrow in .boom-market place contract,
        //       we can never hit the duplicate entry error, unless we call it explicitly
        //       with the .boom-market address.
        const tx2 = BoomMarketPlace.listAsset({
            address: `${deployer.address}.boom-market`,
            id: 1,
            // TODO: given the contract address causing this to fail to parse the principal.
            sender: wallet_1.address
        });
        const block = chain.mineBlock([tx2]);

        // err-duplicate-entry u4
        block.receipts[0].result.expectErr().expectUint(4)
    }
})


Clarinet.test({
    name: "List asset, success",
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get("wallet_1")!;

        // Register token u1 to wallet_1.
        const tx = TradableTraitContractMock.register({address: wallet_1.address, id: 1});
        chain.mineBlock([tx]);

        const tx1 = BoomMarketPlace.listAsset({
            address: wallet_1.address,
            id: 1,
        });
        const block = chain.mineBlock([tx1]);

        block.receipts[0].result.expectOk().expectBool(true);
    }
})
