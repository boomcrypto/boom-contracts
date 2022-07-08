import BoomMarketPlace from "./utils/boom-marketplace.ts";
import {Clarinet} from "../../common/tests/deps.ts";
import MockTradableContract from "./utils/mock-tradable-contract.ts";

Clarinet.test({
    name: 'Admin Ulinst Asset, Success',
    fn: (chain, accounts) => {
        const deployer = accounts.get('deployer')!;
        const owner = accounts.get('wallet_1')!;
        const TOKEN_ID = 22;

        chain.mineBlock(BoomMarketPlace.mintAndListNewAsset({
            address: owner.address,
            id: TOKEN_ID,
        }))

        const block = chain.mineBlock([BoomMarketPlace.adminUnlistAsset({
            sender: deployer.address,
            id: TOKEN_ID
        })]);

        block.receipts[0].result
            .expectOk()
            .expectBool(true);
    }
})

Clarinet.test({
    name: 'Admin unlist not-found Asset',
    fn: (chain, accounts) => {
        const deployer = accounts.get('deployer')!;
        // const owner = accounts.get('wallet_1')!;
        const TOKEN_ID = 22;

        const block = chain.mineBlock([BoomMarketPlace.adminUnlistAsset({
            sender: deployer.address,
            id: TOKEN_ID
        })]);

        block.receipts[0].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.tradableNotFound)
    }
})


Clarinet.test({
    name: 'Admin unlist asset, should returns not allowed Error',
    fn: (chain, accounts) => {
        const scammer = accounts.get('wallet_2')!;
        const owner = accounts.get('wallet_1')!;
        const TOKEN_ID = 22;

        chain.mineBlock(BoomMarketPlace.mintAndListNewAsset({
            address: owner.address,
            id: TOKEN_ID,
        }))

        const block = chain.mineBlock([BoomMarketPlace.adminUnlistAsset({
            sender: scammer.address,
            id: TOKEN_ID
        })]);

        block.receipts[0].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.notAllowed)
    }
})

Clarinet.test({
    name: 'Admin unlist asset, transfer should fail',
    fn: (chain, accounts) => {
        const deployer = accounts.get('deployer')!;
        const owner = accounts.get('wallet_1')!;
        const TOKEN_ID = 22;

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

        const block = chain.mineBlock([BoomMarketPlace.adminUnlistAsset({
            sender: deployer.address,
            id: TOKEN_ID
        })]);

        block.receipts[0].result
            .expectErr()
            .expectUint(BoomMarketPlace.ErrorCodes.transferFailed)
    }
})