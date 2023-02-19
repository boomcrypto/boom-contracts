import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "../../common/tests/deps.ts";

import {
  lend,
  repay,
  repayMany,
  delegateStx as groupDelegateStx,
} from "./client/group-stacker.ts";

import {
  delegateStx,
  addBoombox,
  poxAllowBoomboxAdminAsContractCaller,
} from "./../../boombox-admin/tests/client/boombox-admin.ts";

Clarinet.test({
  name: "User can lend stx",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet1 = accounts.get("wallet_1")!;
    let wallet2 = accounts.get("wallet_2")!;
    const amount = 100_000_000;
    let block = chain.mineBlock([lend(amount, wallet1)]);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "Contract can repay stx",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet1 = accounts.get("wallet_1")!;
    const amount = 100_000_000;
    let block = chain.mineBlock([
      lend(amount, wallet1),
      repay(amount, wallet1.address, wallet1),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "User can't repay more than lend",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet1 = accounts.get("wallet_1")!;
    const amount = 100_000_000;
    let block = chain.mineBlock([
      lend(amount - 100, wallet1),
      repay(amount, wallet1.address, wallet1),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectErr().expectUint(1); // not enough assets
  },
});

Clarinet.test({
  name: "User can repay less than lend",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet1 = accounts.get("wallet_1")!;
    const amount = 100_000_000;
    let block = chain.mineBlock([
      lend(amount, wallet1),
      repay(amount - 100, wallet1.address, wallet1),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "User can repay many users",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet1 = accounts.get("wallet_1")!;
    let wallet2 = accounts.get("wallet_2")!;
    const amount = 100_000_000;
    let block = chain.mineBlock([
      lend(amount, wallet1),
      lend(amount, wallet2),
      repayMany([amount, amount], [wallet1.address, wallet2.address], wallet1),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result
      .expectOk()
      .expectList()
      .map((r) => r.expectOk().expectBool(true));
  },
});

Clarinet.test({
  name: "User can repay many users",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet1 = accounts.get("wallet_1")!;
    let wallet2 = accounts.get("wallet_2")!;
    const amount = 100_000_000;
    let block = chain.mineBlock([
      lend(amount, wallet1),
      repayMany([amount, amount], [wallet1.address, wallet2.address], wallet1),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    const repayResults = block.receipts[1].result.expectOk().expectList();
    repayResults[0].expectOk().expectBool(true);
    repayResults[1].expectErr().expectUint(1);
  },
});

Clarinet.test({
  name: "User can delegate for group-stacker",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet1 = accounts.get("wallet_1")!;
    const amount = 130_000_000_000;
    let block = chain.mineBlock([
      addBoombox(
        deployer.address + ".fp-boombox",
        1,
        1,
        40_000_000,
        deployer,
        deployer
      ),
      poxAllowBoomboxAdminAsContractCaller(
        deployer.address + ".fp-boombox",
        wallet1
      ),
      lend(amount, wallet1),
      // mint fp-boombox for group stacker
      groupDelegateStx(deployer.address + ".fp-boombox", wallet1),
    ]);
    block.receipts[0].result.expectOk().expectUint(1);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectOk().expectBool(true);
    block.receipts[3].result.expectOk().expectBool(true);
  },
});
