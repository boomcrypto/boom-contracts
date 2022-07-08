import {Account, Chain, Clarinet} from 'https://deno.land/x/clarinet@v0.31.0/index.ts';
import MockTradableContract from "./utils/mock-tradable-contract.ts";


Clarinet.test({
    name: "Register new address",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get('wallet_1')!;
        const block = chain.mineBlock([
            MockTradableContract.mint({address: wallet_1.address, id: 1})
        ]);

        block.receipts[0].result
            .expectOk()
            .expectBool(true)
    },
});


Clarinet.test({
        name: 'Get Owner',
        fn: (chain, accounts) => {
            const wallet_1 = accounts.get('wallet_1')!;
            const TOKEN_ID = 1;

            chain.mineBlock([
                MockTradableContract.mint({address: wallet_1.address, id: TOKEN_ID})
            ]);

            const block = chain.mineBlock([
                MockTradableContract.getOwner({address: wallet_1.address, id: TOKEN_ID})
            ]);

            block.receipts[0].result
                .expectOk()
                .expectSome()
                .expectPrincipal(wallet_1.address)
        }
    }
)
