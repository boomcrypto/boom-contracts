import { Tx, Account, types, Chain } from "./../../../common/tests/deps.ts";

export function transfer(
  boomboxName: string,
  id: number,
  from: Account,
  to: Account,
  user: Account
) {
  return Tx.contractCall(
    boomboxName,
    "transfer",
    [
      types.uint(id),
      types.principal(from.address),
      types.principal(to.address),
    ],
    user.address
  );
}

export function setApproved(
  boomboxName: string,
  id: number,
  operator: Account,
  approved: boolean,
  user: Account
) {
  return Tx.contractCall(
    boomboxName,
    "set-approved",
    [types.uint(id), types.principal(operator.address), types.bool(approved)],
    user.address
  );
}

export function setApprovedAll(
  boomboxName: string,
  operator: Account,
  approved: boolean,
  user: Account
) {
  return Tx.contractCall(
    boomboxName,
    "set-approved-all",
    [types.principal(operator.address), types.bool(approved)],
    user.address
  );
}

export function setBoomboxAdmin(
  boomboxName: string,
  boomboxAdmin: string,
  user: Account
) {
  return Tx.contractCall(
    boomboxName,
    "set-boombox-admin",
    [types.principal(boomboxAdmin)],
    user.address
  );
}

export function getOwner(boomboxName: string, id: number, user: Account) {
  return Tx.contractCall(
    boomboxName,
    "get-owner",
    [types.uint(id)],
    user.address
  );
}
