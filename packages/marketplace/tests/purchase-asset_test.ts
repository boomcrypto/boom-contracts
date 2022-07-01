import {Clarinet} from "https://deno.land/x/clarinet@v0.31.1/index.ts";
import BoomMarketPlace from "./utils/boom-marketplace.ts";
import {assertEquals} from "https://deno.land/std@0.124.0/testing/asserts.ts";

Clarinet.test({
    name: 'Purchase Asset, Success',
    fn: (chain, accounts) => {
        const deployer = accounts.get('deployer')!;
        const seller = accounts.get('wallet_1')!;
        const buyer = accounts.get('wallet_2')!;
        const royal = accounts.get('wallet_3')!;
        const TOKEN_ID = 33;

        const PRICE = 1_000_000;
        const COMMISSION = 2_000;
        const ROYALTY_PERCENT = 2500;
        // THEN these amounts should be transferred.
        const amountCommission = (PRICE * COMMISSION) / 10_000;
        const amountRoyalty = (PRICE * ROYALTY_PERCENT) / 10_000;
        const toOwnerAmount = PRICE - (amountCommission + amountRoyalty);

        // Given that seller has a token with TOKEN_ID.
        chain.mineBlock([
            ...BoomMarketPlace.mintAndListNewAsset({
                address: seller.address,
                id: TOKEN_ID,
                price: PRICE,
                commission: COMMISSION,
                sender: seller.address
            }),
            BoomMarketPlace.setRoyalty({
                royal: royal.address,
                percent: ROYALTY_PERCENT,
                sender: deployer.address
            })
        ]);

        // Finally, purchase Asset
        const block = chain.mineBlock([
            BoomMarketPlace.purchaseAsset({address: buyer.address, id: TOKEN_ID}),
        ])

        block.receipts[0].result.expectOk().expectBool(true);
        // 3 Transaction have been made.
        assertEquals(block.receipts[0].events.filter(e => e.type === 'stx_transfer_event').length, 3);
        // Price is paid to seller (previous owner).
        assertEquals(block.receipts[0].events[0].stx_transfer_event, {
            sender: buyer.address,
            recipient: seller.address,
            amount: `${toOwnerAmount}`
        })

        // Commission is paid to the contract owner.
        assertEquals(block.receipts[0].events[1].stx_transfer_event, {
            sender: buyer.address,
            recipient: deployer.address,
            amount: `${amountCommission}`
        })
        // Royalty amount is paid to artist.
        assertEquals(block.receipts[0].events[2].stx_transfer_event, {
            sender: buyer.address,
            recipient: royal.address,
            amount: `${amountRoyalty}`
        })

    }
})

Clarinet.test({
    name: 'Purchase Not-Found Asset',
    fn: (chain, accounts) => {
        const buyer = accounts.get('wallet_1')!;

        // Buying non-existent Token with id = 33.
        const block = chain.mineBlock([
            BoomMarketPlace.purchaseAsset({address: buyer.address, id: 33})
        ])

        block.receipts[0].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.tradableNotFound)
    }
})


Clarinet.test({
    name: 'Purchase Asset with not-enough Balance',
    fn: (chain, accounts) => {
        const seller = accounts.get('wallet_1')!;
        const buyer = accounts.get('wallet_9')!;
        const TOKEN_ID = 33;
        const PRICE = 1_000_000;

        // Mint TOKEN_ID to wallet_1.
        chain.mineBlock(
            BoomMarketPlace.mintAndListNewAsset({
                address: seller.address,
                id: TOKEN_ID,
                price: PRICE
            })
        )

        const block = chain.mineBlock([
            BoomMarketPlace.purchaseAsset({address: buyer.address, id: TOKEN_ID}),
        ])

        block.receipts[0].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.paymentFailed)
    }
})

Clarinet.test({
    name: 'Purchase Asset with Commission Payment Failed',
    fn: (chain, accounts) => {
        const seller = accounts.get('wallet_1')!;
        // balance < owner payment + commission amount
        const buyer = accounts.get('wallet_8')!;
        const TOKEN_ID = 33;
        const PRICE = 1000_000;
        const COMMISSION = 250;

        // Mint TOKEN_ID to wallet_1.
        let b = chain.mineBlock(
            BoomMarketPlace.mintAndListNewAsset({
                address: seller.address,
                id: TOKEN_ID,
                price: PRICE,
                commission: COMMISSION
            })
        )

        const block = chain.mineBlock([
            BoomMarketPlace.purchaseAsset({address: buyer.address, id: TOKEN_ID}),
        ])

        block.receipts[0].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.commissionPaymentFailed)
    }
})

Clarinet.test({
    name: 'Purchase Asset with not enough balance for Royalty',
    fn: (chain, accounts) => {
        const deployer = accounts.get('deployer')!;
        const seller = accounts.get('wallet_1')!;
        // owner payment + commission amount < balance < owner payment + commission amount + Royalty
        const buyer = accounts.get('wallet_8')!;
        const royal = accounts.get('wallet_3')!;
        const TOKEN_ID = 33;

        const PRICE = 1_000_000;
        const COMMISSION = 2_000;
        const ROYALTY_PERCENT = 2500;

        chain.mineBlock([
            ...BoomMarketPlace.mintAndListNewAsset({
                address: seller.address,
                id: TOKEN_ID,
                price: PRICE,
                commission: COMMISSION,
                sender: seller.address
            }),
            BoomMarketPlace.setRoyalty({
                royal: royal.address,
                percent: ROYALTY_PERCENT,
                sender: deployer.address
            })
        ]);
        // Finally, purchase Asset
        const block = chain.mineBlock([
            BoomMarketPlace.purchaseAsset({address: buyer.address, id: TOKEN_ID}),
        ])

        block.receipts[0].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.royaltyPaymentFailed)
    }
})

