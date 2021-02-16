import { expect } from "chai";
import { readFileSync } from "fs";
import { describe } from "mocha";
import { deployContract, user, mainnet, mocknet } from "../deploy";
import { ADDR1, testnetKeyMap } from "../mocknet";

const contractName = mainnet ? "boom-pool-beta-nfts" : "boom-pool-beta-nfts-v1";

const userPrivate = mainnet
  ? user.private
  : mocknet
  ? testnetKeyMap[ADDR1].private
  : JSON.parse(
      readFileSync(
        "../../../github/blockstack/stacks-blockchain/keychain.json"
      ).toString()
    ).private;

describe("boom-pool-nfts deploys suite", () => {
  it("deploys", async () => {
    const result = await deployContract(
      contractName,
      "./contracts/boom-pool-beta-nfts.clar",
      (s) => s,
      userPrivate
    );
    expect(result).to.be.a("string");
  });
});
