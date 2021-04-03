import { readFileSync } from "fs";
import { mainnet } from "../test/deploy";

export const contractName = "boomboxes-cycle-6";
export const contractOwner = JSON.parse(
  readFileSync("../mainnet.json").toString()
);

if (!mainnet) {
  throw new Error("Only use with mainnet");
}
