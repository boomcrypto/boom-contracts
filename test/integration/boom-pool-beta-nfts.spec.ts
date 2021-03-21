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
const contractName = mainnet ? "boom-pool-beta-nfts" : "boom-pool-beta-nfts-v2";

const contractOwner = mainnet
  ? user
  : JSON.parse(
      readFileSync(
        "../../../github/blockstack/stacks-blockchain/keychain.json"
      ).toString()
    );

describe("boom-pool-nfts deploys suite", () => {
  it("fills the accounts", async () => {
    if (mocknet) {
      await faucetCall(contractOwner.stacks, 100000);
      await faucetCall(
        "ST2MY1BVKR8W8NF58N2GX6JDZDRT5CXP6RVZ097M4",
        80000000000000
      );
    }
  });
  it("deploys", async () => {
    const result = await deployContract(
      contractName,
      "./contracts/boom-pool-beta-nfts.clar",
      (s) => s,
      contractOwner.private
    );
    expect(result).to.be.a("string");
  });
  it.only("should payout", async () => {
    const nfts = [1, 2, 3, 4, 5, 6];
    const functionArgs = [
      uintCV(330000000),
      listCV(nfts.map((nftId) => uintCV(nftId))),
    ];
    const tx = await makeContractCall({
      contractAddress: "ST314JC8J24YWNVAEJJHQXS5Q4S9DX1FW5Z9DK9NT",
      contractName: "boom-pool-beta-nfts-v2",
      functionName: "payout",
      functionArgs,
      senderKey: contractOwner.private,
      network,
      postConditionMode: PostConditionMode.Allow,
      fee: new BN(300),
    });
    handleTransaction(tx);
  });
});
