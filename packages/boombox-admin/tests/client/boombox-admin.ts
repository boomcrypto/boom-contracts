import { Tx, Account, types, Chain } from "../../../common/tests/deps.ts";


export function addBoombox(boomboxNftContractName: String, user: Account) {
  return Tx.contractCall(
    "boombox-admin",
    "add-boombox",
    [
      types.principal(`ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.${boomboxNftContractName}`),
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
      "'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.boombox",
      types.uint(amount),
    ],
    user.address
  );
}
