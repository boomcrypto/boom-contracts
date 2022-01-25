import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
  assertEquals,
} from "./libs/deps.ts";

function mintSeries(
  account: Account,
  name: string,
  uri: string,
  ids: number[]
) {
  return Tx.contractCall(
    "boom-nfts",
    "mint-series",
    [
      types.principal(account.address),
      types.none(), // creator name
      types.utf8(name),
      types.ascii(uri),
      types.none(), // hash
      types.list(ids.map((i) => types.uint(i))),
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
      mintSeries(wallet_1, "seriesName", "uri", [1, 2]),
      transfer(1, wallet_1, wallet_2),
      burn(2, wallet_1),
    ]);
    assertEquals(block.height, 2);
    block.receipts[0].result.expectOk().expectUint(1);
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
      mintSeries(wallet_1, "seriesName", "uri", [1, 2]),
      transfer(1, wallet_2, deployer),
    ]);
    block.receipts[0].result.expectOk().expectUint(1);
    block.receipts[1].result.expectErr().expectUint(1);
  },
});

Clarinet.test({
  name: "Ensure that a user can't transfer NFT for others",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet_1 = accounts.get("wallet_1")!;
    const wallet_2 = accounts.get("wallet_2")!;
    let block = chain.mineBlock([
      mintSeries(wallet_1, "seriesName", "uri", [1, 2]),
      transfer(1, wallet_1, wallet_2, wallet_2),
    ]);
    block.receipts[0].result.expectOk().expectUint(1);
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
      mintSeries(wallet_1, "seriesName", "uri", [1, 2]),
      burn(1, wallet_2),
    ]);
    block.receipts[0].result.expectOk().expectUint(1);
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
      mintSeries(wallet_1, "seriesName", "uri", [1, 2]),
      transfer(3, wallet_1, wallet_2),
      burn(4, wallet_1),
    ]);
    block.receipts[0].result.expectOk().expectUint(1);
    block.receipts[1].result.expectErr().expectUint(3);
    block.receipts[2].result.expectErr().expectUint(404);
  },
});
