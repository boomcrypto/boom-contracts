import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
  assertEquals
} from "../../common/tests/deps.ts";
import { poxAllowBoomboxAdminAsContractCaller } from "./client/boombox-admin.ts";

function addBoombox(
  boombox: string,
  cycle: number,
  lockingPeriod: number,
  minAmount: number,
  owner: Account,
  account: Account
) {
  return Tx.contractCall(
    "boombox-admin",
    "add-boombox",
    [
      types.principal(boombox), // boombox trait
      types.uint(cycle),
      types.uint(lockingPeriod),
      types.uint(minAmount),
      types.tuple({ version: "0x01", hashbytes: "0x1234" }),
      types.principal(owner.address),
    ],
    account.address
  );
}

function delegateStx(
  boomboxId: number,
  boombox: string,
  amount: number,
  account: Account
) {
  return Tx.contractCall(
    "boombox-admin",
    "delegate-stx",
    [types.uint(boomboxId), types.principal(boombox), types.uint(amount)],
    account.address
  );
}

function stackAggregationCommit(cycle: number, account: Account) {
  return Tx.contractCall(
    "boombox-admin",
    "stack-aggregation-commit",
    [types.tuple({ version: "0x01", hashbytes: "0x1234" }), types.uint(cycle)],
    account.address
  );
}

/**
 * Pox Info
 * prepare phase: 30 blocks
 * reward phase: 150 blocks
 *
 * last block to delegate: 119
 * first block to stack delegate commit: 120
 */

Clarinet.test({
  name: "Ensure that user can delgate stx and stack aggregation commit",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    const boombox = `${deployer.address}.boombox-simple`;
    const amount = 100_000_000_000_000_000;
    chain.mineEmptyBlock(118);
    let block = chain.mineBlock([
      poxAllowBoomboxAdminAsContractCaller(
        deployer.address + ".boombox-admin",
        wallet_1
      ),
      addBoombox(boombox, 1, 1, 40, wallet_1, wallet_1),
      delegateStx(1, boombox, amount, wallet_1),
    ]);
    assertEquals(block.height, 120);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectUint(1);
    const tuple = block.receipts[2].result.expectOk().expectTuple() as any;
    tuple.id.expectUint(1);
    tuple["nft-id"].expectUint(1);
    const pox = tuple.pox.expectTuple();
    pox["lock-amount"].expectUint(amount);
    pox.stacker.expectPrincipal(wallet_1.address);
    pox["unlock-burn-height"].expectUint(300);

    block = chain.mineBlock([stackAggregationCommit(1, wallet_1)]);
    assertEquals(block.height, 121);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "Ensure that user can't delgate stx after timelimit",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    const boombox = `${deployer.address}.boombox-simple`;
    const amount = 10000000000;
    chain.mineEmptyBlock(119);
    let block = chain.mineBlock([
      poxAllowBoomboxAdminAsContractCaller(
        deployer.address + ".boombox-admin",
        wallet_1
      ),
      addBoombox(boombox, 1, 1, 40, wallet_1, wallet_1),
      delegateStx(1, boombox, amount, wallet_1),
    ]);
    assertEquals(block.height, 121);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectUint(1);
    block.receipts[2].result.expectErr().expectUint(606); // too late
  },
});

Clarinet.test({
  name: "Ensure that user can't stack aggreagte commit without any delegation",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    const boombox = `${deployer.address}.boombox-simple`;
    const amount = 10000000000;
    chain.mineEmptyBlock(120);

    let block = chain.mineBlock([stackAggregationCommit(1, wallet_1)]);
    block.receipts[0].result.expectErr().expectUint(4); // no such principal
  },
});

Clarinet.test({
  name: "Ensure that user can't stack aggregate commit stx before timelimit",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    const boombox = `${deployer.address}.boombox-simple`;
    const amount = 10000000000;
    chain.mineEmptyBlock(100);
    let block = chain.mineBlock([
      poxAllowBoomboxAdminAsContractCaller(
        deployer.address + ".boombox-admin",
        wallet_1
      ),
      addBoombox(boombox, 1, 1, 40, wallet_1, wallet_1),
      delegateStx(1, boombox, amount, wallet_1),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectUint(1);
    block.receipts[2].result.expectOk().expectTuple();

    block = chain.mineBlock([stackAggregationCommit(1, wallet_1)]);
    assertEquals(block.height, 103);
    block.receipts[0].result.expectErr().expectUint(607); // to early
  },
});
