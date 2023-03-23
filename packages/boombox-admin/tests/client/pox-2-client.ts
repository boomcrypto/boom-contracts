import { Chain, Tx, types, Account } from "../../../common/tests/deps.ts";

export function allowContractCaller(
  contractCaller: string,
  untilBurnHt: number | undefined,
  user: Account
) {
  return Tx.contractCall(
    "SP000000000000000000002Q6VF78.pox-2",
    "allow-contract-caller",
    [
      types.principal(contractCaller),
      untilBurnHt ? types.some(types.uint(untilBurnHt)) : types.none(),
    ],
    user.address
  );
}

export function delegateStx(amount: number, delegateTo: string, user: Account) {
  return Tx.contractCall(
    "SP000000000000000000002Q6VF78.pox-2",
    "delegate-stx",
    [types.uint(amount), types.principal(delegateTo), types.none(), types.none()],
    user.address
  );
}

export function stackAggregationCommitIndexed(
  poxAddr: { version: string; hashbytes: string },
  cycle: number,
  poolOperator: Account
) {
  return Tx.contractCall(
    "SP000000000000000000002Q6VF78.pox-2",
    "stack-aggregation-commit-indexed",
    [types.tuple(poxAddr), types.uint(cycle)],
    poolOperator.address
  );
}

export function stackAggregationIncrease(
  poxAddr: { version: string; hashbytes: string },
  cycle: number,
  poxAddrIndex: number,
  poolOperator: Account
) {
  return Tx.contractCall(
    "SP000000000000000000002Q6VF78.pox-2",
    "stack-aggregation-increase",
    [types.tuple(poxAddr), types.uint(cycle), types.uint(poxAddrIndex)],
    poolOperator.address
  );
}

export function revokeDelegateStx(user: Account) {
  return Tx.contractCall(
    "SP000000000000000000002Q6VF78.pox-2",
    "revoke-delegate-stx",
    [],
    user.address
  );
}

export function getPartialStackedByCycle(
  poolPoxAddr: { version: string; hashbytes: string },
  cycle: number,
  poolAddress: string,
  chain: Chain,
  user: Account
) {
  return chain.callReadOnlyFn(
    "SP000000000000000000002Q6VF78.pox-2",
    "get-partial-stacked-by-cycle",
    [types.tuple(poolPoxAddr), types.uint(cycle), types.principal(poolAddress)],
    user.address
  );
}

export function getRewardSetPoxAddress(
  cycle: number,
  index: number,
  chain: Chain,
  user: Account
) {
  return chain.callReadOnlyFn(
    "SP000000000000000000002Q6VF78.pox-2",
    "get-reward-set-pox-address",
    [types.uint(cycle), types.uint(index)],
    user.address
  );
}

export function getPoxInfo(chain: Chain, user: Account) {
  return chain.callReadOnlyFn(
    "SP000000000000000000002Q6VF78.pox-2",
    "get-pox-info",
    [],
    user.address
  );
}
