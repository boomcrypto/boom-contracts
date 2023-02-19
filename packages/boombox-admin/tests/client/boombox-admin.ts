import { Clarinet, Tx, Chain, Account, types, assertEquals } from "../../../common/tests/deps.ts";

export function poxAllowBoomboxAdminAsContractCaller(boomboxAdminContractId: string, account: Account) {
  return Tx.contractCall(
    "SP000000000000000000002Q6VF78.pox",
    "allow-contract-caller",
    [types.principal(boomboxAdminContractId), types.none()],
    account.address
  );
}

export function allowContractCaller(deployer: Account) {
  return Tx.contractCall(
    "boombox-admin",
    "allow-contract-caller",
    [types.principal(deployer.address)],
    deployer.address
  );
}

export function addBoombox(
  boombox: string,
  cycle: number,
  lockingPeriod: number,
  minAmount: number,
  owner: Account,
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
    ],
    account.address
  );
}

export function delegateStx(
  boomboxId: number,
  boombox: string,
  amount: number,
  account: Account
) {
  return Tx.contractCall(
    "boombox-admin",
    "delegate-stx",
    [types.uint(boomboxId), types.principal(boombox), types.uint(amount)],
    account.address
  );
}

export function stackAggregationCommit(cycle: number, account: Account) {
  return Tx.contractCall(
    "boombox-admin",
    "stack-aggregation-commit",
    [types.tuple({ version: "0x01", hashbytes: "0x1234" }), types.uint(cycle)],
    account.address
  );
}

export function extendBoomboxing(stacker: Account, account: Account) {
  return Tx.contractCall(
    "boombox-admin",
    "extend-boomboxing",
    [types.principal(stacker.address)],
    account.address
  );
}

export function extendBoomboxingMany(stackers: Account[], account: Account) {
  return Tx.contractCall(
    "boombox-admin",
    "extend-boomboxing-many",
    [types.list(stackers.map((stacker) => types.principal(stacker.address)))],
    account.address
  );
}
