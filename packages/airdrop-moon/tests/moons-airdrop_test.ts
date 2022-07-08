import { Clarinet, Tx, Chain, Account, types, assertEquals } from "./deps.ts";

import {
  mint,
  transfer,
  burn,
  getLastTokenId,
} from "./clients/moons-airdrop-client.ts";

import { airdrop, airdropTestAccounts } from "./clients/mint-client.ts";

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
  name: "Ensure that a user can burn own NFT",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      airdropTestAccounts(deployer),
      burn(1, wallet_1),
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
=======
} from "https://deno.land/x/clarinet@v0.31.0/index.ts";
import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts";
// @ignore
// import data from "../../../scripts/data.json";
Clarinet.test({
  name: "Ensure that <...>",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet_1 = accounts.get("wallet_1")!;
    const contractName = deployer.address + ".moons-airdrop";
    let block = chain.mineBlock([
      Tx.contractCall(
        contractName,
        "mint",
        [types.principal(wallet_1.address), types.uint(1000)],
        deployer.address
      ),
    ]);
    assertEquals(block.receipts[0].result, types.err(types.uint(100)));
    // data.recipient;
    assertEquals(block.receipts.length, 1);
    assertEquals(block.height, 2);

    // block = chain.mineBlock([
    // ]);
    // assertEquals(block.receipts.length, 0);
    // assertEquals(block.height, 3);
  },
});
