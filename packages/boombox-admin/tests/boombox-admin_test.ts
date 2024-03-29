import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
  assertEquals,
} from "../../common/tests/deps.ts";
import {
  poxAllowBoomboxAdminAsContractCaller,
  getPoxInfo,
} from "./client/boombox-admin.ts";
import {
  expectPartialStackedByCycle,
  expectTotalStackedByCycle,
} from "./utils.ts";

const MAX_NUMBER_OF_BOOMBOXES = 100;
const CYCLE_LENGTH = 2100;
const PREPARE_LENGTH = 100;
const BLOCKS_BEFORE_CYCLE_START = 3;
const poolPoxAddr = {
  version: "0x01",
  hashbytes: "0x1234123412341234123412341234123412341234",
};

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
      types.tuple(poolPoxAddr),
      types.principal(owner.address),
      types.principal(boombox), // distribution trait
    ],
    account.address
  );
}

export function delegateStx(
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
    [
      types.tuple({
        version: "0x01",
        hashbytes: "0x1234123412341234123412341234123412341234",
      }),
      types.uint(cycle),
    ],
    account.address
  );
}

function haltBoombox(id: number, account: Account) {
  return Tx.contractCall(
    "boombox-admin",
    "halt-boombox",
    [types.uint(id)],
    account.address
  );
}
/**
 * Pox Info testnet
 * prepare phase: 30 blocks
 * reward phase: 150 blocks
 *
 * last block to delegate: 119
 * first block to stack delegate commit: 120
 *
 * Pox Info mainnet
 * prepare phase: 100 blocks
 * reward phase: 2100 blocks
 *
 * last block to delegate: 1900
 * first block to stack delegate commit: 1901
 */

Clarinet.test({
  name: "Ensure that user can delgate stx and stack aggregation commit",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    const boombox = `${deployer.address}.boombox-simple`;
    const amount = 100_000_000_000_000_000;
    const expectedLockedAmount = amount - 1_000_000;
    chain.mineEmptyBlock(CYCLE_LENGTH - BLOCKS_BEFORE_CYCLE_START - 2);
    let block = chain.mineBlock([
      poxAllowBoomboxAdminAsContractCaller(
        deployer.address + ".boombox-admin",
        wallet_1
      ),
      addBoombox(boombox, 1, 1, 40, wallet_1, wallet_1),
      delegateStx(1, boombox, amount, wallet_1),
    ]);
    assertEquals(block.height, CYCLE_LENGTH - BLOCKS_BEFORE_CYCLE_START + 1);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectUint(1);
    const tuple = block.receipts[2].result.expectOk().expectTuple() as any;
    tuple.id.expectUint(1);
    tuple["nft-id"].expectUint(1);
    const pox = tuple.pox.expectTuple();
    pox["lock-amount"].expectUint(expectedLockedAmount);
    pox.stacker.expectPrincipal(wallet_1.address);
    pox["unlock-burn-height"].expectUint(2 * CYCLE_LENGTH);

    expectPartialStackedByCycle(
      poolPoxAddr,
      1,
      undefined, // all delegated stx commited through delegate-stx calls
      chain,
      deployer
    );
    expectTotalStackedByCycle(1, 0, expectedLockedAmount, chain, deployer);
  },
});

Clarinet.test({
  name: "Ensure that user can delgate small stx",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    const boombox = `${deployer.address}.boombox-simple`;
    const amount = 100_000_000;
    const expectedLockedAmount = amount - 1_000_000;
    chain.mineEmptyBlock(CYCLE_LENGTH - BLOCKS_BEFORE_CYCLE_START - 2);
    let block = chain.mineBlock([
      poxAllowBoomboxAdminAsContractCaller(
        deployer.address + ".boombox-admin",
        wallet_1
      ),
      addBoombox(boombox, 1, 1, 40, wallet_1, wallet_1),
      delegateStx(1, boombox, amount, wallet_1),
    ]);
    assertEquals(block.height, CYCLE_LENGTH - BLOCKS_BEFORE_CYCLE_START + 1);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectUint(1);
    // verify tx 2
    const delegateStxTuple = block.receipts[2].result
      .expectOk()
      .expectTuple() as any;
    delegateStxTuple.id.expectUint(1);
    delegateStxTuple["nft-id"].expectUint(1);

    const pox = delegateStxTuple.pox.expectTuple();
    pox["lock-amount"].expectUint(expectedLockedAmount);
    pox.stacker.expectPrincipal(wallet_1.address);
    pox["unlock-burn-height"].expectUint(2 * CYCLE_LENGTH);

   
    expectPartialStackedByCycle(
      poolPoxAddr,
      1,
      expectedLockedAmount, // all delegated stx still pending
      chain,
      deployer
    );
    expectTotalStackedByCycle(1, 0, undefined, chain, deployer);
  },
});

Clarinet.test({
  name: "Ensure that user can't delgate stx after timelimit",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    const boombox = `${deployer.address}.boombox-simple`;
    const amount = 10_000_000;
    chain.mineEmptyBlock(CYCLE_LENGTH - BLOCKS_BEFORE_CYCLE_START);
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
    block.receipts[2].result
      .expectOk()
      .expectTuple()
      .pox.expectTuple()
      ["unlock-burn-height"].expectUint(4200);

    chain.mineEmptyBlock(2);
    block = chain.mineBlock([delegateStx(1, boombox, amount, wallet_1)]);
    block.receipts[0].result.expectErr().expectUint(606); // too late
  },
});

Clarinet.test({
  name: "Ensure that user can stack aggregate commit for next cycle with locking period 2",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    const boombox = `${deployer.address}.boombox-simple`;
    const lockingPeriod = 2;
    const amount = 21_000_000_000_000;
    const expectedLockedAmount = amount - 1_000_000;
    let block = chain.mineBlock([
      poxAllowBoomboxAdminAsContractCaller(
        deployer.address + ".boombox-admin",
        wallet_1
      ),
      addBoombox(boombox, 1, lockingPeriod, 40, wallet_1, wallet_1),
      delegateStx(1, boombox, amount, wallet_1),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[0].result.expectOk().expectBool(true); // commit happened

    expectPartialStackedByCycle(
      poolPoxAddr,
      1,
      undefined, // all delegated stx commited
      chain,
      deployer
    );
    expectTotalStackedByCycle(1, 0, expectedLockedAmount, chain, deployer);


    chain.mineEmptyBlock(CYCLE_LENGTH);
    block = chain.mineBlock([stackAggregationCommit(2, wallet_1)]);
    block.receipts[0].result.expectOk().expectBool(true); // commit for cycle 2
    expectPartialStackedByCycle(
      poolPoxAddr,
      2,
      undefined, // all delegated stx commited
      chain,
      deployer
    );
    expectTotalStackedByCycle(2, 0, expectedLockedAmount, chain, deployer);
  },
});

Clarinet.test({
  name: "Ensure that user can try stack aggreagte commit without any delegation",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    chain.mineEmptyBlock(CYCLE_LENGTH - PREPARE_LENGTH);

    let block = chain.mineBlock([stackAggregationCommit(1, wallet_1)]);
    block.receipts[0].result.expectOk().expectBool(false); // no commit happened
  },
});

Clarinet.test({
  name: "Ensure that user can stack aggregate commit at any time",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    const boombox = `${deployer.address}.boombox-simple`;
    const amount = 10_000_000_000_000;
    chain.mineEmptyBlock(CYCLE_LENGTH - BLOCKS_BEFORE_CYCLE_START - 3);
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
    block.receipts[0].result.expectOk().expectBool(false); // no commit happened
  },
});

Clarinet.test({
  name: "Ensure that user can get list of boomboxes up to the maximum length",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    const boombox = `${deployer.address}.boombox-simple`;
    chain.mineEmptyBlock(CYCLE_LENGTH - BLOCKS_BEFORE_CYCLE_START);
    let block = chain.mineBlock([
      poxAllowBoomboxAdminAsContractCaller(
        deployer.address + ".boombox-admin",
        wallet_1
      ),
      addBoombox(boombox, 1, 1, 40, wallet_1, wallet_1),
      addBoombox(boombox, 2, 1, 40, wallet_1, wallet_1),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectUint(1);
    block.receipts[2].result.expectOk().expectUint(2);

    let allBoomboxesResponse = chain.callReadOnlyFn(
      "boombox-admin",
      "get-all-boomboxes",
      [],
      deployer.address
    );
    let allBoomboxes = allBoomboxesResponse.result.expectList();
    assertEquals(allBoomboxes.length, 2);
    allBoomboxes[0].expectTuple()["cycle"].expectUint(1);
    allBoomboxes[1].expectTuple()["cycle"].expectUint(2);

    // add MAX_NUMBER_OF_BOOMBOXES - 2 boomboxes
    const indices = [...Array(MAX_NUMBER_OF_BOOMBOXES - 2).keys()];
    block = chain.mineBlock(
      indices.map((i) => addBoombox(boombox, i + 3, 1, 40, wallet_1, wallet_1))
    );
    allBoomboxesResponse = chain.callReadOnlyFn(
      "boombox-admin",
      "get-all-boomboxes",
      [],
      deployer.address
    );
    allBoomboxes = allBoomboxesResponse.result.expectList();
    assertEquals(allBoomboxes.length, MAX_NUMBER_OF_BOOMBOXES);
    // first two boomboxes
    allBoomboxes[0].expectTuple()["cycle"].expectUint(1);
    allBoomboxes[1].expectTuple()["cycle"].expectUint(2);
    // newly added boomboxes
    allBoomboxes[2].expectTuple()["cycle"].expectUint(3);
    allBoomboxes[MAX_NUMBER_OF_BOOMBOXES - 1]
      .expectTuple()
      ["cycle"].expectUint(MAX_NUMBER_OF_BOOMBOXES);

    // The (MAX_NUMBER_OF_BOOMBOXES+1)-th call to add-boombox fails
    block = chain.mineBlock([
      addBoombox(
        boombox,
        MAX_NUMBER_OF_BOOMBOXES + 1,
        1,
        40,
        wallet_1,
        wallet_1
      ),
    ]);
    // this throws a runtime error
    // clarinet prints this as an error, but the test passes
    // as the runtime error is expected
    assertEquals(block.receipts.length, 0);
  },
});

Clarinet.test({
  name: "Ensure that user can halt boombox",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    const boombox = `${deployer.address}.boombox-simple`;
    chain.mineEmptyBlock(CYCLE_LENGTH - BLOCKS_BEFORE_CYCLE_START);
    let block = chain.mineBlock([
      poxAllowBoomboxAdminAsContractCaller(
        deployer.address + ".boombox-admin",
        wallet_1
      ),
      addBoombox(boombox, 1, 1, 40, wallet_1, wallet_1),
      addBoombox(boombox, 2, 1, 40, wallet_1, wallet_1),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectUint(1);
    block.receipts[2].result.expectOk().expectUint(2);

    block = chain.mineBlock([haltBoombox(2, deployer)]);
    block.receipts[0].result
      .expectOk()
      .expectList()
      [2 - 1].expectTuple()
      .active.expectBool(false);

    let allBoomboxesResponse = chain.callReadOnlyFn(
      "boombox-admin",
      "get-all-boomboxes",
      [],
      deployer.address
    );
    let allBoomboxes = allBoomboxesResponse.result.expectList();
    assertEquals(allBoomboxes.length, 2);
    allBoomboxes[0].expectTuple()["active"].expectBool(true);
    allBoomboxes[1].expectTuple()["active"].expectBool(false);
  },
});
