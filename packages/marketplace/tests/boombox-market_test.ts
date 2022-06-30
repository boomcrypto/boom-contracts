import {assertEquals, Chain, Clarinet, Tx} from "../../common/tests/deps.ts";
import TradableTraitContractMock from "./utils/mock-tradable-contract.ts";
import MockTradableTraitContract from "./utils/mock-tradable-contract.ts";
import BoomMarketPlace from "./utils/boom-marketplace.ts";


const listNewAsset = (address: string, id: number): Tx[] => {
    const tx = MockTradableTraitContract.register({address: address, id: id})

    const listingTx = BoomMarketPlace.listAsset({
        address: address,
        id: id,
    });

    return [tx, listingTx];
}


Clarinet.test({
    name: "List asset, commission too low",
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get("wallet_1")!;

        // Register token u1 to wallet_1.
        chain.mineBlock([
            TradableTraitContractMock.register({address: wallet_1.address, id: 1})
        ]);

        // Given low commission.
        const block = chain.mineBlock([
            BoomMarketPlace.listAsset({
                address: wallet_1.address,
                id: 1,
                price: 1_000_000,
                commission: 200,
            })
        ]);
        // err-commission-or-price-too-low u6
        block.receipts[0].result.expectErr().expectUint(6);
    }
})

Clarinet.test({
    name: "List asset, price too low",
    fn: (chain: Chain, accounts) => {
        const wallet_1 = accounts.get("wallet_1")!;

        // Register token to wallet_1.
        chain.mineBlock([
            TradableTraitContractMock.register({address: wallet_1.address, id: 1})
        ]);

        // Given low price for listing.
        const block = chain.mineBlock([
            BoomMarketPlace.listAsset({
                address: wallet_1.address,
                id: 1,
                price: 2000,
                commission: 1000,
            })
        ]);
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
        chain.mineBlock([
            TradableTraitContractMock.register({address: wallet_1.address, id: 1})
        ]);

        // Given listing asset by non-owner principal.
        const block = chain.mineBlock([
            BoomMarketPlace.listAsset({
                address: wallet_2.address,
                id: 1,
            })
        ]);

        // err-not-allowed u3
        block.receipts[0].result.expectErr().expectUint(3);
    }
})

Clarinet.test({
    name: 'List not-found asset',
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get("wallet_1")!;

        const block = chain.mineBlock([
            BoomMarketPlace.listAsset({
                address: wallet_1.address,
                id: 1,
            })
        ]);

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
        chain.mineBlock([
            TradableTraitContractMock.register({address: wallet_1.address, id: 1})
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

Clarinet.test({
    name: "List asset while listing is frozen",
    fn: (chain, accounts) => {
        const deployer = accounts.get("deployer")!;
        const wallet_1 = accounts.get("wallet_1")!;

        const tx = BoomMarketPlace.setListingsFrozen({
            sender: deployer.address,
            shouldFrozen: true,
        });
        chain.mineBlock([tx]);

        // Try listing, given listings is frozen
        const tx2 = BoomMarketPlace.listAsset({
            address: wallet_1.address,
            id: 1,
        });
        const block = chain.mineBlock([tx2]);

        // err-listings-frozen u7
        block.receipts[0].result.expectErr().expectUint(7);
    }
})

Clarinet.test({
    name: 'Get Listing, Success',
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get('wallet_1')!;
        const ID = 10;

        // Register u10 to wallet_1.
        chain.mineBlock(listNewAsset(wallet_1.address, ID))

        const tx = BoomMarketPlace.getListing({address: wallet_1.address, id: ID});
        const block = chain.mineBlock([tx]);

        const result = <any>block.receipts[0].result.expectOk().expectTuple();
        result["commission"].expectUint(1_000);
        result["owner"].expectPrincipal(wallet_1.address);
        result["price"].expectUint(1_000_000)
    }
})


Clarinet.test({
    name: 'Get Listing of non-existent',
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get('wallet_1')!;
        const ID = 10;

        const tx = BoomMarketPlace.getListing({address: wallet_1.address, id: ID});
        const block = chain.mineBlock([tx]);

        // err-tradable-not-found u5
        block.receipts[0].result.expectErr().expectUint(5);
    }
})

Clarinet.test({
    name: 'Unlist asset, success',
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get('wallet_1')!;
        const ID = 10;

        // Register u10 to wallet_1.
        chain.mineBlock(listNewAsset(wallet_1.address, ID))

        const unlistTx = BoomMarketPlace.unlistAsset({
            address: wallet_1.address,
            id: ID
        });
        const getListingTx = BoomMarketPlace.getListing({address: wallet_1.address, id: ID});
        const block = chain.mineBlock([unlistTx, getListingTx]);

        block.receipts[0].result.expectOk().expectBool(true);
        // err-tradable-not-found u5
        block.receipts[1].result.expectErr().expectUint(5);
    }
})


Clarinet.test({
    name: 'Unlist not-found Asset',
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get('wallet_1')!;

        const unlistTx = BoomMarketPlace.unlistAsset({
            address: wallet_1.address,
            id: 10
        });
        const block = chain.mineBlock([unlistTx]);

        // err-tradable-not-found u5
        block.receipts[0].result.expectErr().expectUint(5);
    }
})

Clarinet.test({
    name: 'Not Allowed Unlisting',
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get('wallet_1')!;
        const wallet_2 = accounts.get('wallet_2')!;

        // Register u10 to wallet_1.
        chain.mineBlock(listNewAsset(wallet_1.address, 10))

        const unlistTx = BoomMarketPlace.unlistAsset({
            address: wallet_2.address,
            id: 10
        });
        const block = chain.mineBlock([unlistTx]);

        // err-not-allowed u3
        block.receipts[0].result.expectErr().expectUint(3);
    }
})


Clarinet.test({
    name: 'Purchase Asset, Success',
    fn: (chain, accounts) => {
        const deployer = accounts.get('deployer')!;
        const seller = accounts.get('wallet_1')!;
        const buyer = accounts.get('wallet_2')!;
        const ID = 33;

        // GIVEN
        const PRICE = 1_000_000;
        const COMMISSION = 2_000;
        // THEN
        const amountCommission = (PRICE * COMMISSION) / 10_000;
        const toOwnerAmount = PRICE - amountCommission


        // Given that seller has token with ID.
        const tx = MockTradableTraitContract.register({address: seller.address, id: ID})
        const listingTx = BoomMarketPlace.listAsset({
            address: seller.address,
            id: ID,
            price: PRICE,
            commission: COMMISSION
        });
        chain.mineBlock([tx, listingTx]);

        // Finally, purchase Asset
        const block = chain.mineBlock([
            BoomMarketPlace.purchaseAsset({address: buyer.address, id: ID}),
        ])

        block.receipts[0].result.expectOk().expectBool(true);
        assertEquals(block.receipts[0].events[0].stx_transfer_event, {
            sender: buyer.address,
            recipient: seller.address,
            amount: `${toOwnerAmount}`
        })

        assertEquals(block.receipts[0].events[1].stx_transfer_event, {
            sender: buyer.address,
            recipient: deployer.address,
            amount: `${amountCommission}`
        })
    }
})




