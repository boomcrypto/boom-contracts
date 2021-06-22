import {
  contractPrincipalCV,
  makeContractCall,
  noneCV,
  PostConditionMode,
  standardPrincipalCV,
  uintCV,
} from "@stacks/transactions";
import { handleTransaction, network, user } from "../test/deploy";
import BN from "bn.js";

const contractOwner = { stacks: "ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM4DF2YCW" };
const contractName = "premier-apricot-hedgehog";

async function stackAggregationCommit(
  user: { private: string },
  cycleId: number
) {
  const tx = await makeContractCall({
    contractAddress: contractOwner.stacks,
    contractName: contractName,
    functionName: "stack-aggregation-commit",
    functionArgs: [uintCV(cycleId)],
    senderKey: user.private,
    network,
    nonce: new BN(47),
    postConditionMode: PostConditionMode.Deny,
  });
  console.log(tx);
  await handleTransaction(tx);
}

stackAggregationCommit(user, 1459);
