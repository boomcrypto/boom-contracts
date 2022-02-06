import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
  assertEquals,
} from "../../common/tests/deps.ts";
import {
  stackAggregationCommit,
  poxAllowContractCaller,
  addBoombox,
  delegateStx,
  extendBoomboxing,
  extendBoomboxingMany,
} from "./client/boombox-admin.ts";

Clarinet.test({
  name: "Ensure that burn height and reward cycle are correctly converted",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let rewardCycle = chain.callReadOnlyFn(
      "boombox-admin",
      "burn-height-to-reward-cycle",
      [types.uint(10)],
      deployer.address
    );
    rewardCycle.result.expectUint(0);

    let burnHeight = chain.callReadOnlyFn(
      "boombox-admin",
      "reward-cycle-to-burn-height",
      [types.uint(0)],
      deployer.address
    );
    burnHeight.result.expectUint(0);
  },
});

/**
 * Pox Info
 * prepare phase: 30 blocks
 * reward phase: 150 blocks
 *
 * last block to delegate: 119
 * first block to stack delegate commit: 120
 *
 * first block to stack delegate commit cycle #2: 270
 * first block to stack delegate commit cycle #3: 420
 *
 * first block to extend for cycle #3: 301
 * first block to extend for cycle #3: 451
 */

[
  { type: "classic", extendable: false, open: false },
  { type: "long", extendable: true, open: false },
  { type: "one-shot", extendable: false, open: true },
  { type: "indefinite", extendable: true, open: true },
].map((config) => {
  Clarinet.test({
    name: `[${config.type}] Ensure that user can delgate stx and stack aggregation commit`,
    async fn(chain: Chain, accounts: Map<string, Account>) {
      let deployer = accounts.get("deployer")!;
      let wallet_1 = accounts.get("wallet_1")!;
      const boombox = `${deployer.address}.boombox-simple`;
      const amount = 100_000_000_000_000_000;
      chain.mineEmptyBlock(118);
      let block = chain.mineBlock([
        poxAllowContractCaller(wallet_1, deployer),
        addBoombox(
          boombox,
          1,
          1,
          40,
          wallet_1,
          config.extendable,
          config.open,
          wallet_1
        ),
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
    name: `[${config.type}] Ensure that user can't delgate stx after timelimit`,
    async fn(chain: Chain, accounts: Map<string, Account>) {
      let deployer = accounts.get("deployer")!;
      let wallet_1 = accounts.get("wallet_1")!;
      const boombox = `${deployer.address}.boombox-simple`;
      const amount = 10000000000;
      chain.mineEmptyBlock(119);
      let block = chain.mineBlock([
        poxAllowContractCaller(wallet_1, deployer),
        addBoombox(boombox, 1, 1, 40, wallet_1, false, false, wallet_1),
        delegateStx(1, boombox, amount, wallet_1),
      ]);
      assertEquals(block.height, 121);
      block.receipts[0].result.expectOk().expectBool(true);
      block.receipts[1].result.expectOk().expectUint(1);
      block.receipts[2].result.expectErr().expectUint(606); // too late
    },
  });

  Clarinet.test({
    name: `[${config.type}] Ensure that user can't stack aggregate commit without any delegation`,
    async fn(chain: Chain, accounts: Map<string, Account>) {
      let deployer = accounts.get("deployer")!;
      let wallet_1 = accounts.get("wallet_1")!;
      const boombox = `${deployer.address}.boombox-simple`;
      chain.mineEmptyBlock(119);

      let block = chain.mineBlock([
        poxAllowContractCaller(wallet_1, deployer),
        addBoombox(boombox, 1, 1, 40, wallet_1, false, false, wallet_1),
      ]);

      block = chain.mineBlock([stackAggregationCommit(1, wallet_1)]);
      block.receipts[0].result.expectErr().expectUint(4); // no such principal
    },
  });

  Clarinet.test({
    name: `[${config.type}] Ensure that user can't stack aggregate commit stx before timelimit`,
    async fn(chain: Chain, accounts: Map<string, Account>) {
      let deployer = accounts.get("deployer")!;
      let wallet_1 = accounts.get("wallet_1")!;
      const boombox = `${deployer.address}.boombox-simple`;
      const amount = 10000000000;
      chain.mineEmptyBlock(100);
      let block = chain.mineBlock([
        poxAllowContractCaller(wallet_1, deployer),
        addBoombox(boombox, 1, 1, 40, wallet_1, false, false, wallet_1),
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

  if (config.extendable) {
    Clarinet.test({
      name: `[${config.type}] Ensure that a user can extends delegation of any member`,
      async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get("deployer")!;
        let wallet_1 = accounts.get("wallet_1")!;
        let wallet_2 = accounts.get("wallet_2")!;
        const boombox = `${deployer.address}.boombox-simple`;
        const amount = 100_000_000_000_000_000;
        chain.mineEmptyBlock(118);
        let block = chain.mineBlock([
          poxAllowContractCaller(wallet_1, deployer),
          addBoombox(boombox, 1, 1, 40, wallet_1, true, config.open, wallet_1),
          delegateStx(1, boombox, amount, wallet_1),
        ]);
        assertEquals(block.height, 120);
        block.receipts[0].result.expectOk().expectBool(true);
        block.receipts[1].result.expectOk().expectUint(1);
        const tuple = block.receipts[2].result.expectOk().expectTuple() as any;
        tuple.id.expectUint(1);
        tuple["nft-id"].expectUint(1);
        let pox = tuple.pox.expectTuple();
        pox["lock-amount"].expectUint(amount);
        pox.stacker.expectPrincipal(wallet_1.address);
        pox["unlock-burn-height"].expectUint(300);

        block = chain.mineBlock([stackAggregationCommit(1, wallet_1)]);
        assertEquals(block.height, 121);
        block.receipts[0].result.expectOk().expectBool(true);

        // next cycle after cool down
        chain.mineEmptyBlock(179);

        block = chain.mineBlock([extendBoomboxing(wallet_1, wallet_2)]);
        assertEquals(block.height, 301);
        pox = block.receipts[0].result.expectOk().expectTuple() as any;
        pox["lock-amount"].expectUint(amount);
        pox.stacker.expectPrincipal(wallet_1.address);
        pox["unlock-burn-height"].expectUint(600);
      },
    });
  }
});

Clarinet.test({
  name: "Ensure that user can't stack aggreagte commit a bad boombox id",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;
    chain.mineEmptyBlock(120);

    let block = chain.mineBlock([stackAggregationCommit(1, wallet_1)]);
    block.receipts[0].result.expectErr().expectUint(4); // no such principal
  },
});

Clarinet.test({
  name: "[indefinite] Ensure that a user can extends delegation of any eligible member that joined after first cycle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;
    const boombox = `${deployer.address}.boombox-simple`;
    const amount = 100_000_000_000_000_000;
    chain.mineEmptyBlock(118);
    let block = chain.mineBlock([
      poxAllowContractCaller(wallet_1, deployer),
      poxAllowContractCaller(wallet_2, deployer),
      addBoombox(boombox, 1, 1, 40, wallet_1, true, true, wallet_1),
      delegateStx(1, boombox, amount, wallet_1),
    ]);
    assertEquals(block.height, 120);
    block.receipts[0].result.expectOk();
    block.receipts[2].result.expectOk();
    block.receipts[3].result.expectOk();

    block = chain.mineBlock([stackAggregationCommit(1, wallet_1)]);
    assertEquals(block.height, 121);
    block.receipts[0].result.expectOk().expectBool(true);

    // cycle 1 has started
    chain.mineEmptyBlock(30);

    block = chain.mineBlock([delegateStx(1, boombox, amount, wallet_2)]);
    block.receipts[0].result.expectOk();

    chain.mineEmptyBlock(148);

    block = chain.mineBlock([
      extendBoomboxing(wallet_1, wallet_3),
      extendBoomboxing(wallet_2, wallet_3),
    ]);

    assertEquals(block.height, 301);
    let pox = block.receipts[0].result.expectOk().expectTuple() as any;
    pox["lock-amount"].expectUint(amount);
    pox.stacker.expectPrincipal(wallet_1.address);
    pox["unlock-burn-height"].expectUint(600);

    block.receipts[1].result.expectErr().expectUint(3); // ERR_STACKING_ALREADY_STACKED

    chain.mineEmptyBlock(179);

    block = chain.mineBlock([
      extendBoomboxingMany([wallet_1, wallet_2], wallet_3),
    ]);

    assertEquals(block.height, 481);

    const results = block.receipts[0].result.expectOk().expectList();
    results[0].expectErr().expectUint(3); // wallet 1 still locked
    pox = results[1].expectOk().expectTuple() as any; // wallet 2 can extend
    pox["lock-amount"].expectUint(amount);
    pox.stacker.expectPrincipal(wallet_2.address);
    pox["unlock-burn-height"].expectUint(750);
  },
});
