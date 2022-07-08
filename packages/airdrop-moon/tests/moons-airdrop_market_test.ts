import { Clarinet, Tx, Chain, Account, types, assertEquals } from "./deps.ts";
import {
  transfer,
  listInUstx,
  buyInUstx,
  unlistInUstx,
} from "./clients/moons-airdrop-client.ts";
import { airdropTestAccounts } from "./clients/mint-client.ts";

Clarinet.test({
  name: "Ensure that NFT can be listed and unlisted",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    const commissionFree = `'${deployer.address}.commission-free`;
    let block = chain.mineBlock([
      airdropTestAccounts(deployer),
      listInUstx(1, 50000000, commissionFree, wallet_1.address),
      unlistInUstx(1, wallet_1.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "Ensure that users can't list and unlist other NFT",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    const commissionFree = `'${deployer.address}.commission-free`;

    let block = chain.mineBlock([
      airdropTestAccounts(deployer),
      listInUstx(1, 50000000, commissionFree, wallet_1.address), // own nft
      listInUstx(1, 50000000, commissionFree, deployer.address), // not owned nft
      unlistInUstx(1, deployer.address), // not owned nft
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectErr().expectUint(104);
    block.receipts[3].result.expectErr().expectUint(104);
  },
});

Clarinet.test({
  name: "Ensure that NFT can't be transferred when listed",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    const commissionFree = `'${deployer.address}.commission-free`;

    let block = chain.mineBlock([
      airdropTestAccounts(deployer),
      listInUstx(1, 50000000, commissionFree, wallet_1.address),
      transfer(1, wallet_1, deployer),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectErr().expectUint(106); // err-listing
  },
});

Clarinet.test({
  name: "Ensure that NFT can be listed and bought",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    const commissionFree = `'${deployer.address}.commission-free`;

    let block = chain.mineBlock([
      airdropTestAccounts(deployer),
      listInUstx(1, 50_000_000, commissionFree, wallet_1.address),
      buyInUstx(1, commissionFree, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectOk().expectBool(true);
    let stxEventbuy = block.receipts[2].events[0];
    let nftEventbuy = block.receipts[2].events[1];
    let logEventbuy = block.receipts[2].events[2];

    assertEquals(stxEventbuy.stx_transfer_event.amount, "50000000");
    assertEquals(stxEventbuy.stx_transfer_event.recipient, wallet_1.address);
    assertEquals(nftEventbuy.nft_transfer_event.recipient, deployer.address);
  },
});

Clarinet.test({
  name: "Ensure that NFT can't be bought when unlisted",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    const commissionFree = `'${deployer.address}.commission-free`;

    let block = chain.mineBlock([
      airdropTestAccounts(deployer),
      listInUstx(1, 50000000, commissionFree, wallet_1.address),
      unlistInUstx(1, wallet_1.address),
      buyInUstx(1, commissionFree, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectOk().expectBool(true);
    block.receipts[3].result.expectErr().expectUint(106); // err-listing
  },
});
