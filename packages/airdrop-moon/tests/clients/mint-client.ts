import { Tx, Account } from "../deps.ts";

export function airdrop(account: Account) {
  return Tx.contractCall("moons-airdrop-mint", "airdrop", [], account.address);
}

export function airdropTestAccounts(account: Account) {
  return Tx.contractCall("test-mint", "airdrop", [], account.address);
}
