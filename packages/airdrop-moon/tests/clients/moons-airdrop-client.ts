import {  Tx, Chain, Account, types } from "../deps.ts";

export function mint(account: Account, id: number) {
  return Tx.contractCall(
    "moons-airdrop",
    "mint",
    [types.principal(account.address), types.uint(id)],
    account.address
  );
}

export function transfer(
  nft: number,
  sender: Account,
  receiver: Account,
  account?: Account
) {
  return Tx.contractCall(
    "moons-airdrop",
    "transfer",
    [
      types.uint(nft),
      types.principal(sender.address),
      types.principal(receiver.address),
    ],
    account ? account.address : sender.address
  );
}

export function burn(nft: number, account: Account) {
  return Tx.contractCall(
    "moons-airdrop",
    "burn",
    [types.uint(nft)],
    account.address
  );
}

export function getLastTokenId(chain: Chain, userAddress: string) {
  return chain.callReadOnlyFn(
    "moons-airdrop",
    "get-last-token-id",
    [],
    userAddress
  ).result;
}



export function listInUstx(
    id: number,
    price: number,
    commission: string,
    userAddress: string
  ) {
    return Tx.contractCall(
      "moons-airdrop",
      "list-in-ustx",
      [types.uint(id), types.uint(price), commission],
      userAddress
    );
  }
  
  export function unlistInUstx(id: number, userAddress: string) {
    return Tx.contractCall(
      "moons-airdrop",
      "unlist-in-ustx",
      [types.uint(id)],
      userAddress
    );
  }
  
  export function buyInUstx(id: number, commission: string, userAddress: string) {
    return Tx.contractCall(
      "moons-airdrop",
      "buy-in-ustx",
      [types.uint(id), commission],
      userAddress
    );
  }