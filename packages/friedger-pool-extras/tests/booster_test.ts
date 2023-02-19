import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
  assertEquals,
} from "../../common/tests/deps.ts";
("../deps.ts");

Clarinet.test({
  name: "Ensure that user can manage recipients",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      Tx.contractCall(
        "booster",
        "set-payout-recipients",
        [
          types.list([
            types.tuple({
              recipient: types.some(types.principal(wallet_1.address)),
              "recipient-burnchain": types.none(),
              percentage: types.uint(50),
            }),
          ]),
        ],
        deployer.address
      ),
    ]);

    block.receipts[0].result.expectOk().expectBool(true);

    let response = chain.callReadOnlyFn(
      "booster",
      "get-payout-recipients",
      [types.principal(deployer.address)],
      deployer.address
    );

    const recipients = response.result.expectSome().expectList();
    recipients[0].expectTuple()["percentage"].expectUint(50);
    recipients[0]
      .expectTuple()
      ["recipient"].expectSome()
      .expectPrincipal(wallet_1.address);
    recipients[0].expectTuple()["recipient-burnchain"].expectNone();

    block = chain.mineBlock([
      Tx.contractCall(
        "booster",
        "delete-payout-recipients",
        [],
        deployer.address
      ),
    ]);

    block.receipts[0].result.expectOk().expectBool(true);

    response = chain.callReadOnlyFn(
      "booster",
      "get-payout-recipients",
      [types.principal(deployer.address)],
      deployer.address
    );

    response.result.expectNone();
  },
});

Clarinet.test({
  name: "Ensure that user can not distribute more than 100 percent",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet_1 = accounts.get("wallet_1")!;
    const wallet_2 = accounts.get("wallet_2")!;
    let block = chain.mineBlock([
      Tx.contractCall(
        "booster",
        "set-payout-recipients",
        [
          types.list([
            types.tuple({
              recipient: types.some(types.principal(wallet_1.address)),
              "recipient-burnchain": types.none(),
              percentage: types.uint(50),
            }),
            types.tuple({
              recipient: types.some(types.principal(wallet_2.address)),
              "recipient-burnchain": types.none(),
              percentage: types.uint(70),
            }),
          ]),
        ],
        deployer.address
      ),
    ]);

    block.receipts[0].result.expectErr().expectUint(500);
  },
});

Clarinet.test({
  name: "Ensure that user can not distribute more than 100 percent across both chains",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet_1 = accounts.get("wallet_1")!;
    const wallet_2 = accounts.get("wallet_2")!;
    let block = chain.mineBlock([
      Tx.contractCall(
        "booster",
        "set-payout-recipients",
        [
          types.list([
            types.tuple({
              recipient: types.some(types.principal(wallet_1.address)),
              "recipient-burnchain": types.none(),
              percentage: types.uint(70),
            }),
            types.tuple({
              recipient: types.none(),
              "recipient-burnchain": types.some(
                types.tuple({
                  version: "0x05",
                  hashbytes: "0x01020304",
                })
              ),
              percentage: types.uint(70),
            }),
          ]),
        ],
        deployer.address
      ),
    ]);

    block.receipts[0].result.expectErr().expectUint(500);
  },
});

Clarinet.test({
  name: "Ensure that user can set recipients on burnchain",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      Tx.contractCall(
        "booster",
        "set-payout-recipients",
        [
          types.list([
            types.tuple({
              recipient: types.none(),
              "recipient-burnchain": types.some(
                types.tuple({
                  version: "0x05",
                  hashbytes: "0x01020304",
                })
              ),
              percentage: types.uint(50),
            }),
          ]),
        ],
        deployer.address
      ),
    ]);

    block.receipts[0].result.expectOk().expectBool(true);

    let response = chain.callReadOnlyFn(
      "booster",
      "get-payout-recipients",
      [types.principal(deployer.address)],
      deployer.address
    );

    const recipients = response.result.expectSome().expectList();
    recipients[0].expectTuple()["percentage"].expectUint(50);
    recipients[0].expectTuple()["recipient"].expectNone();
    const burnchainRecipient = recipients[0]
      .expectTuple()
      ["recipient-burnchain"].expectSome()
      .expectTuple();
    burnchainRecipient["version"].expectBuff(new Uint8Array([5]));
    burnchainRecipient["hashbytes"].expectBuff(new Uint8Array([1, 2, 3, 4]));
  },
});
