import {
  callReadOnlyFunction,
  listCV,
  uintCV,
  cvToJSON,
} from "@stacks/transactions";
import { network } from "../test/deploy";
import { contractOwner, contractName } from "./0-config";

async function getTotalStacked() {
  const lastTokenIdCV = await callReadOnlyFunction({
    contractAddress: contractOwner.stacks,
    contractName: contractName,
    functionName: "get-last-token-id",
    functionArgs: [],
    senderAddress: contractOwner.stacks,
    network,
  });
  const lastTokenId = cvToJSON(lastTokenIdCV).value.value;

  console.log(JSON.stringify(listCV([...new Array(lastTokenId).keys()].map((i) => uintCV(i)))))
  const resultCV = await callReadOnlyFunction({
    contractAddress: contractOwner.stacks,
    contractName: contractName,
    functionName: "get-total-stacked-ustx",
    functionArgs: [
      listCV([...new Array(lastTokenId).keys()].map((i) => uintCV(i + 1))),
    ],
    senderAddress: contractOwner.stacks,
    network,
  });
  console.log(cvToJSON(resultCV));
  return resultCV;
}

getTotalStacked();
