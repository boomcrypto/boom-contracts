import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v0.29.0/index.ts";
import { assertEquals } from "https://deno.land/std@0.109.0/testing/asserts.ts";

function mint(account: Account, id: number) {
  return Tx.contractCall(
    "moons-airdrop",
    "mint",
    [types.principal(account.address), types.uint(id)],
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
    "moons-airdrop",
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
    "moons-airdrop",
    "burn",
    [types.uint(nft)],
    account.address
  );
}

export function getLastTokenId(chain: Chain, userAddress: string) {
  return chain.callReadOnlyFn(
    "moons-airdrop",
    "get-last-token-id",
    [],
    userAddress
  ).result;
}

function airdrop(account: Account) {
  return Tx.contractCall("moons-airdrop-mint", "airdrop", [], account.address);
}

function airdropTestAccounts(account: Account) {
  return Tx.contractCall("test-mint", "airdrop", [], account.address);
}

Clarinet.test({
  name: "Ensure that all nfts have been minted",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([airdrop(deployer)]);
    block.receipts[0].result.expectOk().expectBool(true);

    getLastTokenId(chain, deployer.address).expectOk().expectUint(644);
  },
});

Clarinet.test({
  name: "Ensure that no new nfts can be minted",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      airdrop(deployer),
      mint(wallet_1, 1),
      mint(wallet_1, 643),
      mint(wallet_1, 644),
      mint(wallet_1, 645),
    ]);
    assertEquals(block.height, 2);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectErr().expectUint(104);
    block.receipts[2].result.expectErr().expectUint(104);
    block.receipts[3].result.expectErr().expectUint(104);
    block.receipts[4].result.expectErr().expectUint(104);
  },
});

Clarinet.test({
  name: "Ensure that a user can transfer own NFT",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      airdropTestAccounts(deployer),
      transfer(1, wallet_1, deployer),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "Ensure that a user can't transfer NFT for others",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet_1 = accounts.get("wallet_1")!;
    const wallet_2 = accounts.get("wallet_2")!;
    let block = chain.mineBlock([
      airdropTestAccounts(deployer),
      transfer(1, wallet_1, wallet_2, wallet_2),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectErr().expectUint(104);
  },
});

Clarinet.test({
  name: "Ensure that a user can't burn other NFT",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet_2 = accounts.get("wallet_2")!;
    let block = chain.mineBlock([
      airdropTestAccounts(deployer),
      burn(1, wallet_2),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectErr().expectUint(104);
  },
});

Clarinet.test({
  name: "Ensure that a user can't transfer or burn non-existing NFT",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet_1 = accounts.get("wallet_1")!;
    const wallet_2 = accounts.get("wallet_2")!;
    let block = chain.mineBlock([
      airdrop(deployer),
      transfer(644, wallet_1, wallet_2), // nft does not exist
      transfer(643, wallet_1, wallet_2), // nft not owned by wallet 1
      burn(644, wallet_1),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectErr().expectUint(3);
    block.receipts[2].result.expectErr().expectUint(1);
    block.receipts[3].result.expectErr().expectUint(104);
  },
});
