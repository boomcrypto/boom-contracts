import { Tx, Account, types, Chain } from "../../../common/tests/deps";



export function poxAllowBoomboxAdminAsContractCaller(boomboxAdminContractId: string, account: Account, ) {
  return Tx.contractCall(
    "SP000000000000000000002Q6VF78.pox",
    "allow-contract-caller",
    [types.principal(boomboxAdminContractId), types.none()],
    account.address
  );
}

export function addBoombox(boomboxNftContractName: String, user: Account) {
  return Tx.contractCall(
    "boombox-admin",
    "add-boombox",
    [
      types.principal(
        `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.${boomboxNftContractName}`
      ),
      types.uint(1),
      types.uint(1),
      types.uint(40000000),
      types.tuple({ version: "0x01", hashbytes: "0x1234" }),
      types.principal(user.address),
    ],
    user.address
  );
}

export function delegateStx(
  boomboxId: number,
  boomboxContractId: string,
  amount: number,
  user: Account
) {
  return Tx.contractCall(
    "boombox-admin",
    "delegate-stx",
    [
      types.uint(boomboxId),
      types.principal(boomboxContractId),
      types.uint(amount),
    ],
    user.address
  );
}
