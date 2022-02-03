import { Tx, Account, types, Chain } from "../../../common/tests/deps.ts";

export function poxAllowBoomboxAdminAsContractCaller(
  boomboxAdminContractId: string,
  account: Account
) {
  return Tx.contractCall(
    "SP000000000000000000002Q6VF78.pox",
    "allow-contract-caller",
    [types.principal(boomboxAdminContractId), types.none()],
    account.address
  );
}

export function addBoombox(
  boombox: string,
  cycle: number,
  lockingPeriod: number,
  minAmount: number,
  owner: Account,
  extendable: boolean,
  open: boolean,
  account: Account
) {
  return Tx.contractCall(
    "boombox-admin",
    "add-boombox",
    [
      types.principal(boombox), // boombox trait
      types.uint(cycle),
      types.uint(lockingPeriod),
      types.uint(minAmount),
      types.tuple({ version: "0x01", hashbytes: "0x1234" }),
      types.principal(owner.address),
      types.boolean(extendable),
      types.boolean(open),
    ],
    account.address
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
