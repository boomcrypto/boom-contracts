import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
  assertEquals,
} from "./libs/deps.ts";

function poxAllowContractCaller(account: Account, deployer: Account) {
  return Tx.contractCall(
    "ST000000000000000000002AMW42H.pox",
    "allow-contract-caller",
    [types.principal(deployer.address + ".boomboxes"), types.none()],
    account.address
  );
}

function allowContractCaller(deployer: Account) {
  return Tx.contractCall(
    "boomboxes",
    "allow-contract-caller",
    [types.principal(deployer.address)],
    deployer.address
  );
}

function delegateStx(account: Account, amount: number) {
  return Tx.contractCall(
    "boomboxes",
    "delegate-stx",
    [
      types.uint(amount), // amount
      types.principal(account.address), // stacker
      types.none(),
      types.none(),
    ],
    account.address
  );
}

function payout(
  account: Account,
  amount: number,
  nfts: number[],
  stacksTip: number
) {
  return Tx.contractCall(
    "boomboxes",
    "payout",
    [
      types.uint(amount), // amount
      types.list(nfts.map((i) => types.uint(i))),
      types.uint(stacksTip),
    ],
    account.address
  );
}

function transfer(nft: number, sender: Account, receiver: Account) {
  return Tx.contractCall(
    "boomboxes",
    "transfer",
    [
      types.uint(nft),
      types.principal(sender.address),
      types.principal(receiver.address),
    ],
    sender.address
  );
}

Clarinet.test({
  name: "Ensure that user can delgate stx",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      allowContractCaller(deployer),
      poxAllowContractCaller(wallet_1, deployer),
      delegateStx(wallet_1, 100000000),
    ]);
    assertEquals(block.height, 2);
    block.receipts[0].result.expectOk().expectBool(true);
    const result = block.receipts[2].result;
    console.log(result);
  },
});

Clarinet.test({
  name: "Ensure that pool admin can payout",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet_1 = accounts.get("wallet_1")!;
    const wallet_2 = accounts.get("wallet_2")!;
    const wallet_3 = accounts.get("wallet_3")!;

    chain.mineBlock([
      allowContractCaller(deployer),
      poxAllowContractCaller(wallet_1, deployer),
      poxAllowContractCaller(wallet_2, deployer),
      delegateStx(wallet_1, 100000000),
      delegateStx(wallet_2, 200000000),
    ]);

    let block3 = chain.mineBlock([payout(wallet_2, 100000, [1, 2, 3], 0)]);
    assertEquals(block3.height, 3);
    const results = (block3.receipts[0].result.expectOk().expectTuple() as any)
      .result as String;

    results.expectList()[0].expectOk().expectBool(true);
    results.expectList()[1].expectErr().expectUint(405); // sender === receiver
    results.expectList()[2].expectErr().expectUint(602); // invalid id
    assertEquals(
      (block3.receipts[0].events[0] as any).stx_transfer_event.amount,
      "33333"
    );
    // 66666 STX remain with the sender (owner of nft #2)

    let block4 = chain.mineBlock([transfer(2, wallet_2, wallet_1)]);
    block4.receipts[0].result.expectOk();

    let block5 = chain.mineBlock([payout(wallet_2, 100000, [1, 2, 3], 0)]);
    assertEquals(block5.height, 5);

    const results5 = (
      (block5.receipts[0].result.expectOk().expectTuple() as any)
        .result as String
    ).expectList();

    results5[0].expectOk().expectBool(true);
    results5[1].expectOk().expectBool(true);
    results5[2].expectErr().expectUint(602); // invalid id
    assertEquals(
      (block5.receipts[0].events[0] as any).stx_transfer_event.amount,
      "33333"
    );
    assertEquals(
      (block5.receipts[0].events[1] as any).stx_transfer_event.amount,
      "66666"
    );
  },
});
