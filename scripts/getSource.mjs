import {
  Configuration,
  SmartContractsApi,
} from "@stacks/blockchain-api-client";
import { mkdir, mkdirSync, rmSync, writeFileSync } from "fs";
import fetch from "node-fetch";

const STACKS_API_URL = "https://stacks-node-api.mainnet.stacks.co";

const config = new Configuration({
  basePath: STACKS_API_URL,
  fetchApi: fetch,
});

const api = new SmartContractsApi(config);

const admin1 = "SP497E7RX3233ATBS2AB9G4WTHB63X5PBSP5VGAQ";
const admin2 = "SP1QK1AZ24R132C0D84EEQ8Y2JDHARDR58R72E1ZW";

const downloadSource = async (contractAddress, contractName) => {
  console.log(`downloading ${contractAddress}.${contractName}`)
  const result = await api.getContractSource({
    contractAddress,
    contractName,
  });
  mkdirSync(`contracts/${contractAddress}`, { recursive: true });
  writeFileSync(`contracts/${contractAddress}/${contractName}.clar`, result.source);
};

/*
await downloadSource(admin1, "boom-nfts")
await downloadSource(admin1, "boom-nfts-50")
await downloadSource(admin1, "boomboxes-cycle-6");
await downloadSource(admin1, "boomboxes-cycle-12");
await downloadSource(admin1, "boomboxes-cycle-14");
await downloadSource(admin2, "boomboxes-cycle-16");
await downloadSource(admin2, "boomboxes-cycle-18");
await downloadSource(admin2, "boomboxes-cycle-20");
await downloadSource(admin2, "boomboxes-cycle-22");
await downloadSource(admin2, "boombox-admin");
*/
