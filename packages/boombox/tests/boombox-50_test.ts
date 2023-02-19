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
} from "../../boombox-admin/tests/client/boombox-admin.ts";
import { setBoomboxAdmin, transfer } from "./client/boombox.ts";

const BOOMBOX_NAME = "boombox-50";

Clarinet.test({
  name: "User can transfer nft",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet1 = accounts.get("wallet_1")!;
    let wallet2 = accounts.get("wallet_2")!;
    const amount = 100_000_000;
    let block = chain.mineBlock([
      setBoomboxAdmin(
        BOOMBOX_NAME,
        `${deployer.address}.boombox-admin`,
        deployer
      ),
      addBoombox(BOOMBOX_NAME, deployer, 1, 40000, deployer, deployer),
      poxAllowBoomboxAdminAsContractCaller(
        deployer.address + ".boombox-admin",
        wallet1
      ),
      delegateStx(1, `${deployer.address}.${BOOMBOX_NAME}`, amount, wallet1),
    ]);
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
