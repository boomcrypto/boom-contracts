import { expect } from "chai";
import { readFileSync } from "fs";
import { describe } from "mocha";
import { deployContract, user, mainnet, mocknet, faucetCall } from "../deploy";
import { ADDR1, testnetKeyMap } from "../mocknet";

const contractName = mainnet ? "boom-pool-beta-nfts" : "boom-pool-beta-nfts-v1";

const contractOwner = mainnet
  ? user
  : JSON.parse(
      readFileSync(
        "../../../github/blockstack/stacks-blockchain/keychain.json"
      ).toString()
    );

describe("boom-pool-nfts deploys suite", () => {
  it.only("fills the accounts", async () => {
    if (mocknet) {
      //await faucetCall(contractOwner.stacks, 100000);
      await faucetCall("ST2MY1BVKR8W8NF58N2GX6JDZDRT5CXP6RVZ097M4", 80000000);
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
});
