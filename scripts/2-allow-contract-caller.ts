import {
  contractPrincipalCV,
  makeContractCall,
  PostConditionMode,
} from "@stacks/transactions";
import { handleTransaction, network } from "../test/deploy";
import { contractOwner, contractName } from "./0-config";

async function allowContractCaller() {
  const tx = await makeContractCall({
    contractAddress: contractOwner.stacks,
    contractName: contractName,
    functionName: "allow-contract-caller",
    functionArgs: [contractPrincipalCV(contractOwner.stacks, contractName)],
    senderKey: contractOwner.private,
    network,
    postConditionMode: PostConditionMode.Deny,
  });
  console.log(tx);
  await handleTransaction(tx);
}

allowContractCaller();
