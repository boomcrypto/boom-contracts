import {Clarinet} from "../../common/tests/deps.ts";
import BoomMarketPlace from "./utils/boom-marketplace.ts";


Clarinet.test({
    name: 'Get Listing, Success',
    fn: (chain, accounts) => {
        const wallet_1 = accounts.get('wallet_1')!;
        const TOKEN_ID = 10;
        const COMMISSION = 2_333;
        const PRICE = 1_222_333;

        // Mint TOKEN_ID to wallet_1.
        chain.mineBlock(
            BoomMarketPlace.mintAndListNewAsset({
                address: wallet_1.address,
                id: TOKEN_ID,
                price: PRICE,
                commission: COMMISSION
            })
        )

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





