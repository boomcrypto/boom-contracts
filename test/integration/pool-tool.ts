import {
  listCV,
  makeContractCall,
  PostConditionMode,
  uintCV,
} from "@stacks/transactions";
import { expect } from "chai";
import { BADNAME } from "dns";
import { readFileSync } from "fs";
import { describe } from "mocha";
import {
  deployContract,
  user,
  mainnet,
  mocknet,
  faucetCall,
  network,
  handleTransaction,
} from "../deploy";
import { ADDR1, testnetKeyMap } from "../mocknet";
import BN from "bn.js";
const poxContractAddress = mainnet
  ? "SP000000000000000000002Q6VF78"
  : "ST000000000000000000002AMW42H";

const poolAdmin = JSON.parse(
  readFileSync(
    mainnet ? "../../mainnet-keys.json" : "../../testnet-keys.json"
  ).toString()
);

describe("pool tool suite", () => {
  it("fills the accounts", async () => {
    if (mocknet) {
      await faucetCall(poolAdmin.stacks, 100000);
      await faucetCall(
        "ST2MY1BVKR8W8NF58N2GX6JDZDRT5CXP6RVZ097M4",
        80000000000000
      );
    }
  });

  it.only("delegate and commit", async () => {
    const functionArgs = [
      uintCV(330000000),
      listCV(nfts.map((nftId) => uintCV(nftId))),
    ];
    const tx = await makeContractCall({
      contractAddress: poxContractAddress,
      contractName: "pox",
      functionName: "delegate-stx",
      functionArgs,
      senderKey: poolAdmin.private,
      network,
      postConditionMode: PostConditionMode.Allow,
      fee: new BN(300),
    });
    handleTransaction(tx);
  });
});
