import { Tx, Account, types, Chain } from "./deps.ts";

export function transfer(
  id: number,
  from: Account,
  to: Account,
  user: Account
) {
  return Tx.contractCall(
    "boombox-24",
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
    "boombox-24",
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
    "boombox-24",
    "set-approved-all",
    [types.principal(operator.address), types.bool(approved)],
    user.address
  );
}

export function getOwner(id: number, user: Account) {
  return Tx.contractCall(
    "boombox-24",
    "get-owner",
    [types.uint(id)],
    user.address
  );
}
