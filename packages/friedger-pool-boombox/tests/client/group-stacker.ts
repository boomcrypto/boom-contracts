import { Tx, Account, types, Chain } from "./../../../common/tests/deps.ts";

export function lend(amount: number, user: Account) {
  return Tx.contractCall(
    "group-stacker",
    "lend",
    [types.uint(amount)],
    user.address
  );
}

export function repay(amount: number, recipient: string, user: Account) {
  return Tx.contractCall(
    "group-stacker",
    "repay",
    [types.uint(amount), types.principal(recipient)],
    user.address
  );
}

export function repayMany(amounts: number[], users: string[], user: Account) {
  return Tx.contractCall(
    "group-stacker",
    "repay-many",
    [
      types.list(amounts.map((amount) => types.uint(amount))),
      types.list(users.map((user) => types.principal(user))),
    ],
    user.address
  );
}

export function delegateStx(boomboxContractId: string, user: Account) {
  return Tx.contractCall(
    "group-stacker",
    "delegate-stx",
    [types.principal(boomboxContractId)],
    user.address
  );
}
