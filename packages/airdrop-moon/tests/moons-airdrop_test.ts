import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
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
