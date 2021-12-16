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

const admin1 = "ST314JC8J24YWNVAEJJHQXS5Q4S9DX1FW5Z9DK9NT";
const admin2 = "ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM4DF2YCW";

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
await downloadSource(admin1, "boomboxes-v1");
await downloadSource(admin2, "boom-pool-nfts-v1");
 */