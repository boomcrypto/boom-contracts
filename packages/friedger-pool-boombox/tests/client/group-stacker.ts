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
  