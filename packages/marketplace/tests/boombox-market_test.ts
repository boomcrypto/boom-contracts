import {assertEquals, Chain, Clarinet, Tx} from "../../common/tests/deps.ts";
import TradableTraitContractMock from "./utils/mock-tradable-contract.ts";
import MockTradableContract from "./utils/mock-tradable-contract.ts";
import BoomMarketPlace from "./utils/boom-marketplace.ts";


const listNewAsset = (
    address: string,
    id: number,
    price = 100_0000,
    commission = 1_000
): Tx[] => {
    const tx = MockTradableContract.mint({address: address, id: id})

    const listingTx = BoomMarketPlace.listAsset({
        address: address,
        id: id,
        price,
        commission
    });

    return [tx, listingTx];
}


Clarinet.test({
    name: "List asset, commission too low",
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get("wallet_1")!;

        // Mint token u1 to wallet_1.
        chain.mineBlock([
            TradableTraitContractMock.mint({address: wallet_1.address, id: 1})
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
        block.receipts[0].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.commissionOrPriceTooLow);
    }
})

Clarinet.test({
    name: "List asset, price too low",
    fn: (chain: Chain, accounts) => {
        const wallet_1 = accounts.get("wallet_1")!;

        // Mint token to wallet_1.
        chain.mineBlock([
            TradableTraitContractMock.mint({address: wallet_1.address, id: 1})
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
        block.receipts[0].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.commissionOrPriceTooLow);
    }
})

Clarinet.test({
    name: "List asset, not allowed",
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get("wallet_1")!;
        const wallet_2 = accounts.get("wallet_2")!;

        // Mint token to wallet_1.
        chain.mineBlock([
            TradableTraitContractMock.mint({address: wallet_1.address, id: 1})
        ]);

        // Given listing asset by non-owner principal.
        const block = chain.mineBlock([
            BoomMarketPlace.listAsset({
                address: wallet_2.address,
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
        const wallet_1 = accounts.get("wallet_1")!;

        const block = chain.mineBlock([
            BoomMarketPlace.listAsset({
                address: wallet_1.address,
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
    name: "List asset, success",
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get("wallet_1")!;

        // Mint token u1 to wallet_1.
        const tx = TradableTraitContractMock.mint({address: wallet_1.address, id: 1});
        chain.mineBlock([tx]);

        const tx1 = BoomMarketPlace.listAsset({
            address: wallet_1.address,
            id: 1,
        });
        const block = chain.mineBlock([tx1]);

        block.receipts[0].result
            .expectOk()
            .expectBool(true);
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
        block.receipts[0].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.listingsFrozen);
    }
})

Clarinet.test({
    name: 'Get Listing, Success',
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get('wallet_1')!;
        const TOKEN_ID = 10;
        const COMMISSION = 2_333;
        const PRICE = 1_222_333;

        // Mint TOKEN_ID to wallet_1.
        chain.mineBlock(listNewAsset(wallet_1.address, TOKEN_ID, PRICE, COMMISSION))

        const block = chain.mineBlock([
            BoomMarketPlace.getListing({address: wallet_1.address, id: TOKEN_ID})
        ]);

        const result = <any>block.receipts[0].result
            .expectOk()
            .expectTuple();
        result["commission"].expectUint(COMMISSION);
        result["owner"].expectPrincipal(wallet_1.address);
        result["price"].expectUint(PRICE)
    }
})


Clarinet.test({
    name: 'Get Listing of non-existent',
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get('wallet_1')!;
        const TOKEN_ID = 10;

        const tx = BoomMarketPlace.getListing({address: wallet_1.address, id: TOKEN_ID});
        const block = chain.mineBlock([tx]);

        // err-tradable-not-found u5
        block.receipts[0].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.tradableNotFound);
    }
})

Clarinet.test({
    name: 'Unlist asset, success',
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get('wallet_1')!;
        const TOKEN_ID = 10;

        // Mint TOKEN_ID to wallet_1.
        chain.mineBlock(listNewAsset(wallet_1.address, TOKEN_ID))

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
    name: 'Not Allowed Unlisting',
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get('wallet_1')!;
        const wallet_2 = accounts.get('wallet_2')!;
        const TOKEN_ID = 33;

        // Mint TOKEN_ID to wallet_1.
        chain.mineBlock(listNewAsset(wallet_1.address, TOKEN_ID))

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
    name: 'Purchase Asset, Success',
    fn: (chain, accounts) => {
        const deployer = accounts.get('deployer')!;
        const seller = accounts.get('wallet_1')!;
        const buyer = accounts.get('wallet_2')!;
        const TOKEN_ID = 33;

        // GIVEN
        const PRICE = 1_000_000;
        const COMMISSION = 2_000;
        // THEN
        const amountCommission = (PRICE * COMMISSION) / 10_000;
        const toOwnerAmount = PRICE - amountCommission


        // Given that seller has token with TOKEN_ID.
        const tx = MockTradableContract.mint({address: seller.address, id: TOKEN_ID})
        const listingTx = BoomMarketPlace.listAsset({
            address: seller.address,
            id: TOKEN_ID,
            price: PRICE,
            commission: COMMISSION
        });
        chain.mineBlock([tx, listingTx]);

        // Finally, purchase Asset
        const block = chain.mineBlock([
            BoomMarketPlace.purchaseAsset({address: buyer.address, id: TOKEN_ID}),
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




