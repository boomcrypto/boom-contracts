import chai, { expect } from "chai";
import { Client, Provider, ProviderRegistry } from "@blockstack/clarity";
import { ADDR1, ADDR2, ADDR3, ADDR4 } from "../mocknet";
import chaiString from "chai-string";
const c32 = require("c32check");
import { providerWithInitialAllocations } from "../providerWithInitialAlloc";

chai.use(chaiString);
const poolToolContractId = `${ADDR4}.pool-tool`;

describe("pool tool", () => {
  let provider: Provider;
  let client: Client;
  let poxClient: Client;
  before(async () => {
    await ProviderRegistry.registerProvider(
      providerWithInitialAllocations([
        { principal: ADDR1, amount: 30000 },
        { principal: ADDR2, amount: 30000 },
        { principal: ADDR3, amount: 30000 },
        { principal: ADDR4, amount: 30000 },
      ])
    );
    provider = await ProviderRegistry.createProvider();
    client = new Client(poolToolContractId, "pool-tool", provider);
    poxClient = new Client(
      "ST000000000000000000002AMW42H.pox",
      "mock-pox",
      provider
    );
    expect((await poxClient.deployContract()).success).to.be.true;
  });

  const delegateStackStxAndCommit = async (
    members: { stacker: string; amountUstx: number }[],
    startBurnHeight: number,
    lockPeriod: number,
    rewardCycle: number,
    sender: string
  ) => {
    const listString = members
      .map((m) => `{stacker: '${m.stacker}, amount-ustx: u${m.amountUstx}}`)
      .join(" ");
    const hash = c32.c32addressDecode(sender)[1];
    const tx = await client.createTransaction({
      method: {
        name: "delegate-stack-stx-and-commit",
        args: [
          `(list ${listString})`,
          `(tuple (hashbytes 0x${hash.toString("hex")}) (version 0x00)) `,
          `u${startBurnHeight}`,
          `u${lockPeriod}`,
          `u${rewardCycle}`,
        ],
      },
    });
    await tx.sign(sender);
    return client.submitTransaction(tx);
  };

  const payout = async (
    payoutUstx: number,
    stackedUstx: number,
    members: { stacker: string; amountUstx: number }[],
    sender: string
  ) => {
    const listString = members
      .map((m) => `{stacker: '${m.stacker}, amount-ustx: u${m.amountUstx}}`)
      .join(" ");
    const tx = await client.createTransaction({
      method: {
        name: "payout",
        args: [`u${payoutUstx}`, `u${stackedUstx}`, `(list ${listString})`],
      },
    });
    await tx.sign(sender);
    return client.submitTransaction(tx);
  };

  const donate = async (sender: string) => {
    const tx = await client.createTransaction({
      method: {
        name: "donate",
        args: ["u1"],
      },
    });
    await tx.sign(sender);
    return client.submitTransaction(tx);
  };

  const emptyContract = async (sender: string) => {
    const tx = await client.createTransaction({
      method: {
        name: "empty-contract",
        args: [],
      },
    });
    await tx.sign(sender);
    return client.submitTransaction(tx);
  };

  const mineBlocks = async (numberOfBlocks: number) => {
    for (let i = 0; i < numberOfBlocks; i++) {
      const tx = await client.createTransaction({
        method: {
          name: "invalid-name",
          args: [],
        },
      });
      tx.sign(ADDR1);
      await client.submitTransaction(tx);
    }
  };

  const getBalance = async (address: string) => {
    return client.provider.eval(
      poolToolContractId,
      `(stx-get-balance '${address})`
    );
  };

  it("should have a valid syntax", async () => {
    await client.checkContract();
  });

  describe("pool tool deployed", async () => {
    const members = [
      { stacker: ADDR2, amountUstx: 10000 },
      { stacker: ADDR3, amountUstx: 20000 },
    ];
    const total = 30000;

    before(async () => {
      await client.deployContract();
    });

    it("should stack stx and commit", async () => {
      const result = await delegateStackStxAndCommit(members, 1, 1, 1, ADDR4);
      expect(result.success, JSON.stringify(result)).is.true;
      expect(result.result).to.startWith(
        "Transaction executed and committed. Returned: (tuple (stack-result ((ok (tuple (lock-amount u10000) (stacker ST26FVX16539KKXZKJN098Q08HRX3XBAP541MFS0P) (unlock-burn-height u101))) (ok (tuple (lock-amount u20000) (stacker ST3CECAKJ4BH08JYY7W53MC81BYDT4YDA5M7S5F53) (unlock-burn-height u101))))) (total u30000))"
      );
    });

    it("should payout", async () => {
      const result = await payout(10, total, members, ADDR4);
      expect(result.success).is.true;
      expect(result.result).to.startWith(
        `Transaction executed and committed. Returned: true`
      );
      let balance2 = await getBalance(ADDR2);
      expect(balance2.result).to.equal("u20003"); //10k locked
      let balance3 = await getBalance(ADDR3);
      expect(balance3.result).to.equal("u10006"); // 20k locked
      let balance4 = await getBalance(ADDR4);
      expect(balance4.result).to.equal("u29991"); // initial balance - payout
    });

    it("should donate", async () => {
      const result = await donate(ADDR1);
      expect(result.success, JSON.stringify(result)).is.true;
      expect(result.result).to.startWith(
        "Transaction executed and committed. Returned: true"
      );
      const balance = await getBalance(poolToolContractId);
      expect(balance.result).to.equal("u1"); // initial balance - bond + bond
    });

    it("should empty contract", async () => {
      const result = await emptyContract(ADDR4);
      expect(result.success, JSON.stringify(result)).is.true;
      expect(result.result).to.startWith(
        "Transaction executed and committed. Returned: true"
      );
      const balance = await getBalance(ADDR4);
      expect(balance.result).to.equal("u29992"); // initial balance - payout + donation
    });
  });
});
