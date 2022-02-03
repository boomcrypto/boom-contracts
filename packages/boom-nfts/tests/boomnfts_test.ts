import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v0.16.0/index.ts";
import { assertEquals } from "https://deno.land/std@0.109.0/testing/asserts.ts";

function mintSeries(
  account: Account,
  uri: string,
  ids: number[],
  royalties: number
) {
  return Tx.contractCall(
    "boom-nfts",
    "mint-series",
    [
      types.principal(account.address),
      types.ascii(uri),
      types.none(), // hash
      types.list(ids.map((i) => types.uint(i))),
      types.uint(royalties),
      types.none(),
    ],
    account.address
  );
}

function transfer(
  nft: number,
  sender: Account,
  receiver: Account,
  account?: Account
) {
  return Tx.contractCall(
    "boom-nfts",
    "transfer",
    [
      types.uint(nft),
      types.principal(sender.address),
      types.principal(receiver.address),
    ],
    account ? account.address : sender.address
  );
}

function burn(nft: number, account: Account) {
  return Tx.contractCall(
    "boom-nfts",
    "burn",
    [types.uint(nft)],
    account.address
  );
}

Clarinet.test({
  name: "Ensure that user can mint a series",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let block = chain.mineBlock([
      mintSeries(wallet_1, "uri", [1, 2], 0),
      transfer(1, wallet_1, wallet_2),
      burn(2, wallet_1),
    ]);
    assertEquals(block.height, 2);
    const result = block.receipts[0].result.expectOk().expectTuple() as any;
    result["ids"].expectList()[0].expectUint(1);
    result["ids"].expectList()[1].expectUint(2);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "Ensure that a user can't transfer other NFT",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet_1 = accounts.get("wallet_1")!;
    const wallet_2 = accounts.get("wallet_2")!;
    let block = chain.mineBlock([
      mintSeries(wallet_1, "uri", [1, 2], 10),
      transfer(1, wallet_2, deployer),
    ]);
    const result = block.receipts[0].result.expectOk().expectTuple() as any;
    result["ids"].expectList()[0].expectUint(1);
    result["ids"].expectList()[1].expectUint(2);
    block.receipts[1].result.expectErr().expectUint(403);
  },
});

Clarinet.test({
  name: "Ensure that a user can't transfer NFT for others",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet_1 = accounts.get("wallet_1")!;
    const wallet_2 = accounts.get("wallet_2")!;
    let block = chain.mineBlock([
      mintSeries(wallet_1, "uri", [1, 2], 10),
      transfer(1, wallet_1, wallet_2, wallet_2),
    ]);
    const result = block.receipts[0].result.expectOk().expectTuple() as any;
    result["ids"].expectList()[0].expectUint(1);
    result["ids"].expectList()[1].expectUint(2);
    block.receipts[1].result.expectErr().expectUint(403);
  },
});

Clarinet.test({
  name: "Ensure that a user can't burn other NFT",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet_1 = accounts.get("wallet_1")!;
    const wallet_2 = accounts.get("wallet_2")!;
    let block = chain.mineBlock([
      mintSeries(wallet_1, "uri", [1, 2], 10),
      burn(1, wallet_2),
    ]);
    const result = block.receipts[0].result.expectOk().expectTuple() as any;
    result["ids"].expectList()[0].expectUint(1);
    result["ids"].expectList()[1].expectUint(2);
    block.receipts[1].result.expectErr().expectUint(403);
  },
});

Clarinet.test({
  name: "Ensure that a user can't transfer or burn non-existing NFT",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet_1 = accounts.get("wallet_1")!;
    const wallet_2 = accounts.get("wallet_2")!;
    let block = chain.mineBlock([
      mintSeries(wallet_1, "uri", [1, 2], 10),
      transfer(3, wallet_1, wallet_2),
      burn(4, wallet_1),
    ]);
    const result = block.receipts[0].result.expectOk().expectTuple() as any;
    result["ids"].expectList()[0].expectUint(1);
    result["ids"].expectList()[1].expectUint(2);
    block.receipts[1].result.expectErr().expectUint(404);
    block.receipts[2].result.expectErr().expectUint(404);
  },
});
