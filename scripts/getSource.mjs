import {
  Configuration,
  SmartContractsApi,
} from "@stacks/blockchain-api-client";
import { mkdir, mkdirSync, rmSync, writeFileSync } from "fs";
import fetch from "node-fetch";

const STACKS_API_URL = "https://stacks-node-api.testnet.stacks.co";

const config = new Configuration({
  basePath: STACKS_API_URL,
  fetchApi: fetch,
});

const api = new SmartContractsApi(config);

const admin1 = "ST1QK1AZ24R132C0D84EEQ8Y2JDHARDR58SMAYMMW";

const downloadSource = async (contractAddress, contractName) => {
  console.log(`downloading ${contractAddress}.${contractName}`);
  const result = await api.getContractSource({
    contractAddress,
    contractName,
  });
  mkdirSync(`contracts/${contractAddress}`, { recursive: true });
  writeFileSync(
    `contracts/${contractAddress}/${contractName}.clar`,
    result.source
  );
};

/*
await downloadSource(admin1, "boom-nfts-v6");
await downloadSource(admin1, "boom-nft-300");
await downloadSource(admin1, "boom-nft-300-v2");
await downloadSource(admin1, "boom-nft-300-v3");
await downloadSource(admin1, "boom-market-v1");
await downloadSource(admin1, "boom-market-ext-v1");
await downloadSource(admin1, "tradables-trait");
await downloadSource(admin1, "tradables-trait-ext");
await downloadSource(admin1, "commission-trait");
*/
