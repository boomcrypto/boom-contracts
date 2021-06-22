import { readFileSync } from "fs";
import { mainnet } from "../test/deploy";

export const contractFilePath = "./contracts/boomboxes-11.clar"
export const contractName = "boomboxes-cycle-11";
export const imageUri =
  "https://cloudflare-ipfs.com/ipfs/bafkreicpyq7jvun4wb6e3zkt5lib5w5npihumljyfzjopzlwfans6lvarq";
export const contractOwner = JSON.parse(
  readFileSync("../boom-mainnet.json").toString()
);

if (!mainnet) {
  throw new Error("Only use with mainnet");
}
