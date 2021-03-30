import {
  contractPrincipalCV,
  listCV,
  makeContractCall,
  noneCV,
  PostConditionMode,
  uintCV,
} from "@stacks/transactions";
import { expect } from "chai";
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
  processing
} from "../deploy";
import BN from "bn.js";
import {
  standardPrincipalCV,
} from "@stacks/transactions";

const contractName = mainnet ? "boomboxes" : "boomboxes-v1";

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
  it.only("deploys", async () => {    
    const result = await deployContract(
      contractName,
      "./contracts/boomboxes.clar",
      (s) => s, //.replace(/ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM4DF2YCW/g, contractOwner.stacks ),
      contractOwner.private
    );
    expect(result).to.be.a("string");
    await processing(result)
  });

  it("should allow contract caller", async () => {
    const tx = await makeContractCall({
      contractAddress: contractOwner.stacks,
      contractName: contractName,
      functionName: "allow-contract-caller",
      functionArgs: [contractPrincipalCV(contractOwner.stacks, contractName)],
      senderKey: contractOwner.private,
      network,
      postConditionMode: PostConditionMode.Deny,
    });
    await handleTransaction(tx);

    const txUser = await makeContractCall({
      contractAddress: "ST000000000000000000002AMW42H",
      contractName: "pox",
      functionName: "allow-contract-caller",
      functionArgs: [contractPrincipalCV(contractOwner.stacks, contractName), noneCV()],
      senderKey: user.private,
      network,
      postConditionMode: PostConditionMode.Deny,
    });
    await handleTransaction(txUser);
  })

  it("should create an nft", async () => {
    const functionArgs = [
      standardPrincipalCV(user.stacks),
      uintCV(101),
      noneCV(),
      noneCV(),
    ];
    const tx = await makeContractCall({
      contractAddress: contractOwner.stacks,
      contractName: contractName,
      functionName: "delegate-stx",
      functionArgs,
      senderKey: user.private,
      network,
      postConditionMode: PostConditionMode.Deny,
    });
    console.log(JSON.stringify(tx))
    await handleTransaction(tx);
  });

  it("should payout", async () => {
    const nfts = [1, 2, 3, 4, 5, 6];
    const functionArgs = [
      uintCV(330000000),
      listCV(nfts.map((nftId) => uintCV(nftId))),
    ];
    const tx = await makeContractCall({
      contractAddress: contractOwner.stacks,
      contractName,
      functionName: "payout",
      functionArgs,
      senderKey: contractOwner.private,
      network,
      postConditionMode: PostConditionMode.Allow,
    });
    await handleTransaction(tx);
  });
});
