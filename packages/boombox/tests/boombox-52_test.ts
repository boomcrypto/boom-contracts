import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
  assertEquals,
} from "../../common/tests/deps.ts";
import {
  delegateStx,
  addBoombox,
  poxAllowBoomboxAdminAsContractCaller,
} from "./client/boombox-admin.ts";
import { setBoomboxAdmin, transfer } from "./client/boombox.ts";

const BOOMBOX_NAME = "boombox-52";

const ERR_NOT_AUTHORIZED = 403;
const ERR_LISTING = 103;

function mineBlockWith1Boombox(
  chain: Chain,
  deployer: Account,
  wallet1: Account,
  amount: number
) {
  return chain.mineBlock([
    setBoomboxAdmin(
      BOOMBOX_NAME,
      "SP1QK1AZ24R132C0D84EEQ8Y2JDHARDR58R72E1ZW.boombox-admin-v3",
      deployer
    ),
    addBoombox(BOOMBOX_NAME, deployer),
    poxAllowBoomboxAdminAsContractCaller(
      "SP1QK1AZ24R132C0D84EEQ8Y2JDHARDR58R72E1ZW.boombox-admin-v3",
      wallet1
    ),
    delegateStx(1, `${deployer.address}.${BOOMBOX_NAME}`, amount, wallet1),
  ]);
}
Clarinet.test({
  name: "User can transfer nft",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet1 = accounts.get("wallet_1")!;
    let wallet2 = accounts.get("wallet_2")!;
    const amount = 100_000_000;
    let block = mineBlockWith1Boombox(chain, deployer, wallet1, amount);

    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectUint(1);
    block.receipts[2].result.expectOk().expectBool(true);
    (block.receipts[3].result.expectOk().expectTuple() as any)[
      "nft-id"
    ].expectUint(1);

    block = chain.mineBlock([
      transfer(BOOMBOX_NAME, 1, wallet1, wallet2, wallet1),
    ]);

    block.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "NFT can be listed by owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet1 = accounts.get("wallet_1")!;
    const amount = 100_000_000;
    mineBlockWith1Boombox(chain, deployer, wallet1, amount);

    let block = chain.mineBlock([
      Tx.contractCall(
        BOOMBOX_NAME,
        "list-in-ustx",
        ["u1", "u2", `'${deployer.address}.commission-nop`],
        wallet1.address
      ),
      Tx.contractCall(
        BOOMBOX_NAME,
        "get-listing-in-ustx",
        ["u1"],
        wallet1.address
      ),
    ]);

    block.receipts[0].result.expectOk().expectBool(true);
    const listing = block.receipts[1].result.expectSome().expectTuple() as {
      [key: string]: String;
    };
    assertEquals(listing["price"], "u2");
    assertEquals(listing["commission"], `${deployer.address}.commission-nop`);
  },
});

Clarinet.test({
  name: "NFT cannot be listed by non-owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet1 = accounts.get("wallet_1")!;
    const wallet2 = accounts.get("wallet_2")!;

    const amount = 100_000_000;
    mineBlockWith1Boombox(chain, deployer, wallet1, amount);

    let block = chain.mineBlock([
      Tx.contractCall(
        BOOMBOX_NAME,
        "list-in-ustx",
        ["u1", "u2", `'${deployer.address}.commission-nop`],
        wallet2.address
      ),
      Tx.contractCall(
        BOOMBOX_NAME,
        "get-listing-in-ustx",
        ["u1"],
        wallet2.address
      ),
    ]);

    block.receipts[0].result.expectErr().expectUint(ERR_NOT_AUTHORIZED);
    block.receipts[1].result.expectNone();
  },
});

Clarinet.test({
  name: "NFT can be de-listed by owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet1 = accounts.get("wallet_1")!;

    const amount = 100_000_000;
    mineBlockWith1Boombox(chain, deployer, wallet1, amount);

    let block = chain.mineBlock([
      Tx.contractCall(
        BOOMBOX_NAME,
        "list-in-ustx",
        ["u1", "u2", `'${deployer.address}.commission-nop`],
        wallet1.address
      ),
      Tx.contractCall(
        BOOMBOX_NAME,
        "get-listing-in-ustx",
        ["u1"],
        wallet1.address
      ),
      Tx.contractCall(BOOMBOX_NAME, "unlist-in-ustx", ["u1"], wallet1.address),
      Tx.contractCall(
        BOOMBOX_NAME,
        "get-listing-in-ustx",
        ["u1"],
        wallet1.address
      ),
    ]);

    block.receipts[0].result.expectOk().expectBool(true);
    const listing = block.receipts[1].result.expectSome().expectTuple() as {
      [key: string]: String;
    };
    assertEquals(listing["price"], "u2");
    assertEquals(listing["commission"], `${deployer.address}.commission-nop`);
    block.receipts[2].result.expectOk().expectBool(true);
    block.receipts[3].result.expectNone();
  },
});

Clarinet.test({
  name: "NFT cannot be de-listed by non-owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet1 = accounts.get("wallet_1")!;
    const wallet2 = accounts.get("wallet_2")!;

    const amount = 100_000_000;
    mineBlockWith1Boombox(chain, deployer, wallet1, amount);

    let block = chain.mineBlock([
      Tx.contractCall(
        BOOMBOX_NAME,
        "list-in-ustx",
        ["u1", "u2", `'${deployer.address}.commission-nop`],
        wallet1.address
      ),
      Tx.contractCall(
        BOOMBOX_NAME,
        "get-listing-in-ustx",
        ["u1"],
        wallet2.address
      ),
      Tx.contractCall(BOOMBOX_NAME, "unlist-in-ustx", ["u1"], wallet2.address),
      Tx.contractCall(
        BOOMBOX_NAME,
        "get-listing-in-ustx",
        ["u1"],
        wallet2.address
      ),
    ]);

    block.receipts[0].result.expectOk().expectBool(true);
    let listing = block.receipts[1].result.expectSome().expectTuple() as {
      [key: string]: String;
    };
    assertEquals(listing["price"], "u2");
    assertEquals(listing["commission"], `${deployer.address}.commission-nop`);
    block.receipts[2].result.expectErr().expectUint(ERR_NOT_AUTHORIZED);
    listing = block.receipts[3].result.expectSome().expectTuple() as {
      [key: string]: String;
    };
    assertEquals(listing["price"], "u2");
    assertEquals(listing["commission"], `${deployer.address}.commission-nop`);
  },
});

Clarinet.test({
  name: "Listed NFT can be purchased",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet1 = accounts.get("wallet_1")!;
    const wallet2 = accounts.get("wallet_2")!;

    const amount = 100_000_000;
    mineBlockWith1Boombox(chain, deployer, wallet1, amount);

    let block = chain.mineBlock([
      Tx.contractCall(
        BOOMBOX_NAME,
        "list-in-ustx",
        ["u1", "u2000000", `'${deployer.address}.commission-nop`],
        wallet1.address
      ),
      Tx.contractCall(
        BOOMBOX_NAME,
        "buy-in-ustx",
        ["u1", `'${deployer.address}.commission-nop`],
        wallet2.address
      ),
      Tx.contractCall(BOOMBOX_NAME, "get-owner", ["u1"], wallet1.address),
    ]);

    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[1].events.expectSTXTransferEvent(
      2_000_000,
      wallet2.address,
      wallet1.address
    );
    block.receipts[1].events.expectSTXTransferEvent(
      50_000,
      wallet2.address,
      "SP1QK1AZ24R132C0D84EEQ8Y2JDHARDR58R72E1ZW"
    );
    block.receipts[2].result
      .expectOk()
      .expectSome()
      .expectPrincipal(wallet2.address);
  },
});

Clarinet.test({
  name: "Unlisted NFT cannot be purchased",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet1 = accounts.get("wallet_1")!;
    const wallet2 = accounts.get("wallet_2")!;

    const amount = 100_000_000;
    mineBlockWith1Boombox(chain, deployer, wallet1, amount);

    let block = chain.mineBlock([
      Tx.contractCall(
        BOOMBOX_NAME,
        "buy-in-ustx",
        ["u1", `'${deployer.address}.commission-nop`],
        wallet2.address
      ),
    ]);

    block.receipts[0].result.expectErr().expectUint(ERR_LISTING);
  },
});

Clarinet.test({
  name: "Listed NFT cannot be transferred",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet1 = accounts.get("wallet_1")!;
    const wallet2 = accounts.get("wallet_2")!;

    const amount = 100_000_000;
    mineBlockWith1Boombox(chain, deployer, wallet1, amount);

    let block = chain.mineBlock([
      Tx.contractCall(
        BOOMBOX_NAME,
        "list-in-ustx",
        ["u1", "u2", `'${deployer.address}.commission-nop`],
        wallet1.address
      ),
      Tx.contractCall(
        BOOMBOX_NAME,
        "transfer",
        ["u1", `'${wallet1.address}`, `'${wallet2.address}`],
        wallet1.address
      ),
    ]);

    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectErr().expectUint(ERR_LISTING);
  },
});

Clarinet.test({
  name: "NFT can only be listed once",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet1 = accounts.get("wallet_1")!;
    const wallet2 = accounts.get("wallet_2")!;

    const amount = 100_000_000;
    mineBlockWith1Boombox(chain, deployer, wallet1, amount);

    let block = chain.mineBlock([
      Tx.contractCall(
        BOOMBOX_NAME,
        "list-in-ustx",
        ["u1", "u2000000", `'${deployer.address}.commission-nop`],
        wallet1.address
      ),
      Tx.contractCall(
        BOOMBOX_NAME,
        "list-in-ustx",
        ["u1", "u4000000", `'${deployer.address}.commission-nop`],
        wallet1.address
      ),
      Tx.contractCall(
        BOOMBOX_NAME,
        "buy-in-ustx",
        ["u1", `'${deployer.address}.commission-nop`],
        wallet2.address
      ),
      Tx.contractCall(BOOMBOX_NAME, "get-owner", ["u1"], wallet2.address),
    ]);

    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectOk().expectBool(true);
    block.receipts[2].events.expectSTXTransferEvent(
      4_000_000,
      wallet2.address,
      wallet1.address
    );
    block.receipts[2].events.expectSTXTransferEvent(
      100_000,
      wallet2.address,
      "SP1QK1AZ24R132C0D84EEQ8Y2JDHARDR58R72E1ZW"
    );
    block.receipts[3].result
      .expectOk()
      .expectSome()
      .expectPrincipal(wallet2.address);
  },
});
