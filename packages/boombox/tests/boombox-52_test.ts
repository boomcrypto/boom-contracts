import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.3.0/index.ts"
import {
  delegateStx,
  addBoombox,
} from "../../boombox-admin/tests/boombox-admin_test.ts"
import { poxAllowBoomboxAdminAsContractCaller } from "../../boombox-admin/tests/client/boombox-admin.ts"
import { setBoomboxAdmin, transfer } from "./client/boombox.ts"
import { assertEquals } from "https://deno.land/std@0.122.0/testing/asserts.ts"

const BOOMBOX = "boombox-52"

const ERR_NOT_AUTHORIZED = 101
const ERR_LISTING = 103

Clarinet.test({
  name: "User can transfer nft",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!
    let wallet1 = accounts.get("wallet_1")!
    let wallet2 = accounts.get("wallet_2")!
    const amount = 100_000_000
    let block = chain.mineBlock([
      setBoomboxAdmin(`${deployer.address}.boombox-admin`, deployer),
      addBoombox("boombox-52", deployer),
      poxAllowBoomboxAdminAsContractCaller(
        deployer.address + ".boombox-admin",
        wallet1
      ),
      delegateStx(1, `${deployer.address}.${BOOMBOX}`, amount, wallet1),
    ])
    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectUint(1)
    block.receipts[2].result.expectOk().expectBool(true)
    ;(block.receipts[3].result.expectOk().expectTuple() as any)[
      "nft-id"
    ].expectUint(1)

    block = chain.mineBlock([transfer(1, wallet1, wallet2, wallet1)])

    block.receipts[0].result.expectOk().expectBool(true)
  },
})

Clarinet.test({
  name: "NFT can be listed by owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!
    const wallet_2 = accounts.get("wallet_2")!

    let block = chain.mineBlock([
      Tx.contractCall(
        BOOMBOX,
        "list-in-ustx",
        ["u1", "u2", `'${deployer.address}.${BOOMBOX}`],
        wallet_2.address
      ),
      Tx.contractCall(BOOMBOX, "get-listing-in-ustx", ["u1"], wallet_2.address),
    ])
    assertEquals(block.receipts.length, 4)
    assertEquals(block.height, 2)

    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    block.receipts[2].result.expectOk().expectBool(true)
    const listing = block.receipts[3].result.expectSome().expectTuple() as {
      [key: string]: String
    }
    assertEquals(listing["price"], "u2")
    assertEquals(listing["commission"], `${deployer.address}.${BOOMBOX}`)
  },
})

Clarinet.test({
  name: "NFT cannot be listed by non-owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!
    const wallet_2 = accounts.get("wallet_2")!
    const wallet_3 = accounts.get("wallet_3")!

    let block = chain.mineBlock([
      Tx.contractCall(
        BOOMBOX,
        "list-in-ustx",
        ["u1", "u2", `'${deployer.address}.${BOOMBOX}`],
        wallet_3.address
      ),
      Tx.contractCall(BOOMBOX, "get-listing-in-ustx", ["u1"], wallet_2.address),
    ])
    assertEquals(block.receipts.length, 4)
    assertEquals(block.height, 2)

    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    block.receipts[2].result.expectErr().expectUint(ERR_NOT_AUTHORIZED)
    block.receipts[3].result.expectNone()
  },
})

Clarinet.test({
  name: "NFT can be de-listed by owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!
    const wallet_2 = accounts.get("wallet_2")!

    let block = chain.mineBlock([
      Tx.contractCall(
        BOOMBOX,
        "list-in-ustx",
        ["u1", "u2", `'${deployer.address}.${BOOMBOX}`],
        wallet_2.address
      ),
      Tx.contractCall(BOOMBOX, "get-listing-in-ustx", ["u1"], wallet_2.address),
      Tx.contractCall(BOOMBOX, "unlist-in-ustx", ["u1"], wallet_2.address),
      Tx.contractCall(BOOMBOX, "get-listing-in-ustx", ["u1"], wallet_2.address),
    ])
    assertEquals(block.receipts.length, 6)
    assertEquals(block.height, 2)

    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    block.receipts[2].result.expectOk().expectBool(true)
    const listing = block.receipts[3].result.expectSome().expectTuple() as {
      [key: string]: String
    }
    assertEquals(listing["price"], "u2")
    assertEquals(listing["commission"], `${deployer.address}.${BOOMBOX}`)
    block.receipts[4].result.expectOk().expectBool(true)
    block.receipts[5].result.expectNone()
  },
})

Clarinet.test({
  name: "NFT cannot be de-listed by non-owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!
    const wallet_2 = accounts.get("wallet_2")!
    const wallet_3 = accounts.get("wallet_3")!

    let block = chain.mineBlock([
      Tx.contractCall(
        BOOMBOX,
        "list-in-ustx",
        ["u1", "u2", `'${deployer.address}.${BOOMBOX}`],
        wallet_2.address
      ),
      Tx.contractCall(BOOMBOX, "get-listing-in-ustx", ["u1"], wallet_2.address),
      Tx.contractCall(BOOMBOX, "unlist-in-ustx", ["u1"], wallet_3.address),
      Tx.contractCall(BOOMBOX, "get-listing-in-ustx", ["u1"], wallet_2.address),
    ])
    assertEquals(block.receipts.length, 6)
    assertEquals(block.height, 2)

    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    block.receipts[2].result.expectOk().expectBool(true)
    let listing = block.receipts[3].result.expectSome().expectTuple() as {
      [key: string]: String
    }
    assertEquals(listing["price"], "u2")
    assertEquals(listing["commission"], `${deployer.address}.${BOOMBOX}`)
    block.receipts[4].result.expectErr().expectUint(ERR_NOT_AUTHORIZED)
    listing = block.receipts[5].result.expectSome().expectTuple() as {
      [key: string]: String
    }
    assertEquals(listing["price"], "u2")
    assertEquals(listing["commission"], `${deployer.address}.${BOOMBOX}`)
  },
})

Clarinet.test({
  name: "Listed NFT can be purchased",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!
    const wallet_1 = accounts.get("wallet_1")!
    const wallet_2 = accounts.get("wallet_2")!
    const wallet_3 = accounts.get("wallet_3")!

    let block = chain.mineBlock([
      Tx.contractCall(
        BOOMBOX,
        "list-in-ustx",
        ["u1", "u2000000", `'${deployer.address}.${BOOMBOX}`],
        wallet_2.address
      ),
      Tx.contractCall(
        BOOMBOX,
        "buy-in-ustx",
        ["u1", `'${deployer.address}.${BOOMBOX}`],
        wallet_3.address
      ),
      Tx.contractCall(BOOMBOX, "get-owner", ["u1"], wallet_2.address),
    ])

    assertEquals(block.receipts.length, 5)
    assertEquals(block.height, 2)

    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    block.receipts[2].result.expectOk().expectBool(true)
    block.receipts[3].result.expectOk().expectBool(true)
    block.receipts[3].events.expectSTXTransferEvent(
      2_000_000,
      wallet_3.address,
      wallet_2.address
    )
    block.receipts[3].events.expectSTXTransferEvent(
      40_000,
      wallet_3.address,
      wallet_1.address
    )
    block.receipts[4].result
      .expectOk()
      .expectSome()
      .expectPrincipal(wallet_3.address)
  },
})

Clarinet.test({
  name: "Unlisted NFT cannot be purchased",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!
    const wallet_1 = accounts.get("wallet_1")!
    const wallet_2 = accounts.get("wallet_2")!
    const wallet_3 = accounts.get("wallet_3")!

    let block = chain.mineBlock([
      Tx.contractCall(
        BOOMBOX,
        "buy-in-ustx",
        ["u1", `'${deployer.address}.${BOOMBOX}`],
        wallet_3.address
      ),
    ])

    assertEquals(block.receipts.length, 3)
    assertEquals(block.height, 2)

    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    block.receipts[2].result.expectErr().expectUint(ERR_LISTING)
  },
})

Clarinet.test({
  name: "Listed NFT cannot be transferred",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!
    const wallet_1 = accounts.get("wallet_1")!
    const wallet_2 = accounts.get("wallet_2")!
    const wallet_3 = accounts.get("wallet_3")!

    let block = chain.mineBlock([
      Tx.contractCall(
        BOOMBOX,
        "list-in-ustx",
        ["u1", "u2", `'${deployer.address}.${BOOMBOX}`],
        wallet_2.address
      ),
      Tx.contractCall(
        BOOMBOX,
        "transfer",
        ["u1", `'${wallet_2.address}`, `'${wallet_3.address}`],
        wallet_2.address
      ),
    ])

    console.log(block, null, 2)
    assertEquals(block.receipts.length, 4)
    assertEquals(block.height, 2)

    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    block.receipts[2].result.expectOk().expectBool(true)
    block.receipts[3].result.expectErr().expectUint(ERR_LISTING)
  },
})

Clarinet.test({
  name: "NFT can only be listed once",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!
    const wallet_1 = accounts.get("wallet_1")!
    const wallet_2 = accounts.get("wallet_2")!
    const wallet_3 = accounts.get("wallet_3")!

    let block = chain.mineBlock([
      Tx.contractCall(
        BOOMBOX,
        "list-in-ustx",
        ["u1", "u2000000", `'${deployer.address}.${BOOMBOX}`],
        wallet_2.address
      ),
      Tx.contractCall(
        BOOMBOX,
        "list-in-ustx",
        ["u1", "u4000000", `'${deployer.address}.${BOOMBOX}`],
        wallet_2.address
      ),
      Tx.contractCall(
        BOOMBOX,
        "buy-in-ustx",
        ["u1", `'${deployer.address}.${BOOMBOX}`],
        wallet_3.address
      ),
      Tx.contractCall(BOOMBOX, "get-owner", ["u1"], wallet_2.address),
    ])

    assertEquals(block.receipts.length, 6)
    assertEquals(block.height, 2)

    block.receipts[0].result.expectOk().expectBool(true)
    block.receipts[1].result.expectOk().expectBool(true)
    block.receipts[2].result.expectOk().expectBool(true)
    block.receipts[3].result.expectOk().expectBool(true)
    block.receipts[4].result.expectOk().expectBool(true)
    block.receipts[4].events.expectSTXTransferEvent(
      4_000_000,
      wallet_3.address,
      wallet_2.address
    )
    block.receipts[4].events.expectSTXTransferEvent(
      80_000,
      wallet_3.address,
      wallet_1.address
    )
    block.receipts[5].result
      .expectOk()
      .expectSome()
      .expectPrincipal(wallet_3.address)
  },
})
