import { Tx, Account, types, Chain } from "./../../../common/tests/deps.ts";

export function transfer(
  id: number,
  from: Account,
  to: Account,
  user: Account
) {
  return Tx.contractCall(
    "boombox",
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
  id: number,
  operator: Account,
  approved: boolean,
  user: Account
) {
  return Tx.contractCall(
    "boombox",
    "set-approved",
    [types.uint(id), types.principal(operator.address), types.bool(approved)],
    user.address
  );
}

export function setApprovedAll(
  operator: Account,
  approved: boolean,
  user: Account
) {
  return Tx.contractCall(
    "boombox",
    "set-approved-all",
    [types.principal(operator.address), types.bool(approved)],
    user.address
  );
}


export function setBoomboxAdmin(
  boomboxAdmin: string,  
  user: Account
) {
  return Tx.contractCall(
    "boombox",
    "set-boombox-admin",
    [types.principal(boomboxAdmin)],
    user.address
  );
}

export function getOwner(id: number, user: Account) {
  return Tx.contractCall(
    "boombox",
    "get-owner",
    [types.uint(id)],
    user.address
  );
}
