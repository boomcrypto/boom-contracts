import {
  contractPrincipalCV,
  makeContractCall,
  noneCV,
  PostConditionMode,
} from "@stacks/transactions";
import { handleTransaction, network, user } from "../test/deploy";
//import { contractOwner, contractName } from "./0-config";
const contractOwner = { stacks: "ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM4DF2YCW" };
const contractName = "premier-apricot-hedgehog";

async function allowContractCaller(user: { private: string }) {
  const tx = await makeContractCall({
    contractAddress: "ST000000000000000000002AMW42H",
    contractName: "pox",
    functionName: "allow-contract-caller",
    functionArgs: [
      contractPrincipalCV(contractOwner.stacks, contractName),
      noneCV(),
    ],
    senderKey: user.private,
    network,
    postConditionMode: PostConditionMode.Deny,
  });
  console.log(tx);
  await handleTransaction(tx);
}

//allowContractCaller(contractOwner);
allowContractCaller(user);
