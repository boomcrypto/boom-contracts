//
// utils functions

import {
  broadcastTransaction,
  makeContractDeploy,
  makeSTXTokenTransfer,
  StacksTransaction,
  TxBroadcastResultOk,
  TxBroadcastResultRejected,
} from "@stacks/transactions";
import { StacksMainnet, StacksTestnet } from "@stacks/network";
import * as fs from "fs";
const BN = require("bn.js");
const fetch = require("node-fetch");

import { ADDR1, ADDR2, ADDR3, ADDR4, testnetKeyMap } from "./mocknet";

export const local = false;
export const mocknet = false;
export const noSidecar = false;
export const mainnet = false;

const STACKS_CORE_API_URL = local
  ? noSidecar
    ? "http://localhost:20443"
    : "http://localhost:3999"
  : mainnet
  ? "https://stacks-node-api.mainnet.stacks.co"
  : "https://stacks-node-api.testnet.stacks.co";
export const STACKS_API_URL = local
  ? "http://localhost:3999"
  : mainnet
  ? "https://stacks-node-api.mainnet.stacks.co"
  : "https://stacks-node-api.testnet.stacks.co";
export const network = mainnet ? new StacksMainnet() : new StacksTestnet();
network.coreApiUrl = STACKS_CORE_API_URL;

export const user = mainnet
  ? JSON.parse(fs.readFileSync("../mainnet.json").toString())
  : testnetKeyMap[ADDR1];

//
export async function handleTransaction(transaction: StacksTransaction) {
  console.log(network);
  const result = await broadcastTransaction(transaction, network);
  console.log(result);
  if ((result as TxBroadcastResultRejected).error) {
    if (
      (result as TxBroadcastResultRejected).reason === "ContractAlreadyExists"
    ) {
      console.log("already deployed");
      return "" as TxBroadcastResultOk;
    } else {
      throw new Error(
        `failed to handle transaction ${transaction.txid()}: ${JSON.stringify(
          result
        )}`
      );
    }
  }
  const processed = await processing(result as TxBroadcastResultOk);
  if (!processed) {
    throw new Error(
      `failed to process transaction ${transaction.txid}: transaction not found`
    );
  }
  console.log(processed, result);
  return result as TxBroadcastResultOk;
}

export async function deployContract(
  contractName: string,
  path: string = `./contracts/${contractName}.clar`,
  changeCode: (s: string) => string = (s) => s,
  userPrivate: string = user.private
) {
  const codeBody = fs.readFileSync(path).toString();
  var transaction = await makeContractDeploy({
    contractName,
    codeBody: changeCode(codeBody),
    senderKey: userPrivate,
    network,
  });
  console.log(`deploy contract ${contractName}`);
  return handleTransaction(transaction);
}

export async function faucetCall(recipient: string, amount: number) {
  console.log("init wallet");
  const transaction = await makeSTXTokenTransfer({
    recipient,
    amount: new BN(amount),
    senderKey: testnetKeyMap[ADDR3].private,
    network,
  });

  return handleTransaction(transaction);
}

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function processing(
  tx: String,
  count: number = 0
): Promise<boolean> {
  return noSidecar
    ? processingWithoutSidecar(tx, count)
    : processingWithSidecar(tx, count);
}

async function processingWithoutSidecar(
  tx: String,
  count: number = 0
): Promise<boolean> {
  await timeout(10000);
  return true;
}

async function processingWithSidecar(
  tx: String,
  count: number = 0
): Promise<boolean> {
  const url = `${STACKS_API_URL}/extended/v1/tx/${tx}`;
  var result = await fetch(url);
  var value = await result.json();
  console.log(count);
  if (value.tx_status === "success") {
    console.log(`transaction ${tx} processed`);
    console.log(value);
    return true;
  }
  if (value.tx_status === "pending") {
    console.log(value);
  } else if (count === 10) {
    console.log(value);
  }

  if (count > 30) {
    console.log("failed after 30 trials");
    console.log(value);
    return false;
  }

  if (mocknet) {
    await timeout(5000);
  } else {
    await timeout(120000);
  }
  return processing(tx, count + 1);
}
