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

const BOOMBOX_NAMES = [
  "boombox-30",
  "boombox-32",
  "boombox-34",
  "boombox-36",
  "boombox-38",
  "boombox-40",
  "boombox-42",
  "boombox-44",
  "boombox-46",
  "boombox-48",
  "boombox-50",
];

BOOMBOX_NAMES.map((boomboxName) => {
  Clarinet.test({
    name: `User can transfer ${boomboxName} NFT`,
    async fn(chain: Chain, accounts: Map<string, Account>) {
      let deployer = accounts.get("deployer")!;
      let wallet1 = accounts.get("wallet_1")!;
      let wallet2 = accounts.get("wallet_2")!;
      const amount = 100_000_000;
      let block = chain.mineBlock([
        setBoomboxAdmin(
          boomboxName,
          "SP1QK1AZ24R132C0D84EEQ8Y2JDHARDR58R72E1ZW.boombox-admin-v3",
          deployer
        ),
        addBoombox(boomboxName, deployer, 1, 40000, deployer, deployer),
        poxAllowBoomboxAdminAsContractCaller(
          "SP1QK1AZ24R132C0D84EEQ8Y2JDHARDR58R72E1ZW.boombox-admin-v3",
          wallet1
        ),
        delegateStx(1, `${deployer.address}.${boomboxName}`, amount, wallet1),
      ]);
      block.receipts[0].result.expectOk().expectBool(true);
      block.receipts[1].result.expectOk().expectUint(1);
      block.receipts[2].result.expectOk().expectBool(true);
      (block.receipts[3].result.expectOk().expectTuple() as any)[
        "nft-id"
      ].expectUint(1);

      block = chain.mineBlock([
        transfer(boomboxName, 1, wallet1, wallet2, wallet1),
      ]);

      block.receipts[0].result.expectOk().expectBool(true);
    },
  });
});
