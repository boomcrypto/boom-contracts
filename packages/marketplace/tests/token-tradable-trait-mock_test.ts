import {Account, Chain, Clarinet, Contract} from 'https://deno.land/x/clarinet@v0.31.0/index.ts';
import {Tx, types} from "../../common/tests/deps.ts";


const registerToken = (address: string, id: number): Tx => {
    return Tx.contractCall(
        'mock-tradable-trait',
        'register',
        [types.uint(id), types.principal(address)],
        address
    )
}

const getOwnerOfToken = (id: number, caller: string): Tx => {
    return Tx.contractCall(
        'mock-tradable-trait',
        'get-owner',
        [types.uint(id)],
        caller
    )
}

Clarinet.test({
    name: "Register new address",
    async fn(chain: Chain, accounts: Map<string, Account>, contracts: Map<string, Contract>,) {
        const wallet_1 = accounts.get('wallet_1')!;
        const tx = registerToken(wallet_1.address, 1);
        const block = chain.mineBlock([tx]);

        block.receipts[0].result.expectOk().expectBool(true)
    },
});


Clarinet.test({
        name: 'Get Owner',
        fn: (chain, accounts) => {
            const wallet_1 = accounts.get('wallet_1')!;

            const tx = registerToken(wallet_1.address, 1)
            let block = chain.mineBlock([tx]);

            const tx1 = getOwnerOfToken(1, wallet_1.address);
            block = chain.mineBlock([tx1]);

            block.receipts[0].result.expectOk().expectSome().expectPrincipal(wallet_1.address)
        }
    }
)
