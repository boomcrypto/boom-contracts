import {
  AnchorMode,
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

async function delegateStx(user: { private: string; stacks: string }) {
  const tx = await makeContractCall({
    contractAddress: contractOwner.stacks,
    contractName: contractName,
    functionName: "delegate-stx",
    functionArgs: [
      uintCV(86_000_000_000_000),
      standardPrincipalCV(user.stacks),
      noneCV(),
      noneCV(),
    ],
    nonce: new BN(46),
    senderKey: user.private,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  });
  console.log(tx);
  await handleTransaction(tx);
}

delegateStx(user);
