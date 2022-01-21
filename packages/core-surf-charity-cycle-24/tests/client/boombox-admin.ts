import { Tx, Account, types, Chain } from "./deps.ts";

// (define-public (add-boombox (nft-contract <bb-trait>) (cycle uint) (locking-period uint) (minimum-amount uint) (pox-addr {version: (buff 1), hashbytes: (buff 20)}) (owner principal))
export function addBoombox(user: Account) {
  return Tx.contractCall(
    "boombox-admin",
    "add-boombox",
    [
      types.principal("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.boombox-24"),
      types.uint(1),
      types.uint(1),
      types.uint(40000000),
      types.tuple({ version: "0x01", hashbytes: "0x1234" }),
      types.principal(user.address),
    ],
    user.address
  );
}

export function delegateStx(amount: number, user: Account) {
  return Tx.contractCall(
    "boombox-admin",
    "delegate-stx",
    [
      types.uint(1),
      "'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.boombox-24",
      types.uint(amount),
    ],
    user.address
  );
}
