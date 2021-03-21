import chai, { expect } from "chai";
import { Client, Provider, ProviderRegistry } from "@blockstack/clarity";
import { ADDR1, ADDR2, ADDR3, ADDR4 } from "../mocknet";
import chaiString from "chai-string";
const c32 = require("c32check");
import { providerWithInitialAllocations } from "../providerWithInitialAlloc";

chai.use(chaiString);

const poolContractId = `${ADDR4}.boom-pool-beta-nft`;

describe("boom pool beta nfts", () => {
  let provider: Provider;
  let client: Client;
  let poxClient: Client;
  before(async () => {
    await ProviderRegistry.registerProvider(
      providerWithInitialAllocations([
        { principal: ADDR1, amount: 30000 },
        { principal: ADDR2, amount: 30000 },
        { principal: ADDR3, amount: 10000 },
        { principal: ADDR4, amount: 10000 },
      ])
    );
    provider = await ProviderRegistry.createProvider();
    await new Client(
      "ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM4DF2YCW.nft-trait",
      "../contracts/sips/sip-9-nft-trait.clar",
      provider
    ).deployContract();
    client = new Client(poolContractId, "boom-pool-beta-nfts", provider);
    poxClient = new Client(
      "ST000000000000000000002AMW42H.pox",
      "mock-pox",
      provider
    );
    expect((await poxClient.deployContract()).success).to.be.true;
  });

  const joinPool = async (
    stacker: string,
    amount: number,
    untilBurnHeight: number
  ) => {
    const tx = await client.createTransaction({
      method: {
        name: "delegate-stx",
        args: [
          `'${stacker}`,
          `u${amount}`,
          `(some u${untilBurnHeight})`,
          "none",
        ],
      },
    });
    await tx.sign(stacker);
    return client.submitTransaction(tx);
  };

  const transfer = async (id: number, sender: string, recipient: string) => {
    const tx = await client.createTransaction({
      method: {
        name: "transfer",
        args: [`u${id}`, `'${sender}`, `'${recipient}`],
      },
    });
    await tx.sign(sender);
    return client.submitTransaction(tx);
  };

  const getOwner = async (id: number) => {
    const query = await client.createQuery({
      method: {
        name: "get-owner",
        args: [`u${id}`],
      },
    });
    return client.submitQuery(query);
  };

  const getMeta = async () => {
    const query = await client.createQuery({
      method: {
        name: "get-nft-meta",
        args: [],
      },
    });
    return client.submitQuery(query);
  };

  const getLastTokenId = async () => {
    const query = await client.createQuery({
      method: {
        name: "get-last-token-id",
        args: [],
      },
    });
    return client.submitQuery(query);
  };

  const delegateStackStxCommit = async (
    ids: number[],
    sender: string,
    startBurnHeight: number,
    lockPeriod: number,
    rewardCycle: number
  ) => {
    const idsString = ids.map((id) => id.toString()).join(" u");
    const hash = c32.c32addressDecode(sender)[1];
    const tx = await client.createTransaction({
      method: {
        name: "delegate-stack-stx-and-commit",
        args: [
          `(list u${idsString})`,
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

  const payout = async (amount: number, ids: number[], sender: string) => {
    const idsString = ids.map((id) => id.toString()).join(" u");
    const tx = await client.createTransaction({
      method: {
        name: "payout",
        args: [`u${amount}`, `(list u${idsString})`],
      },
    });
    await tx.sign(sender);
    return client.submitTransaction(tx);
  };

  const fundBond = async (amount: number, sender: string) => {
    const tx = await client.createTransaction({
      method: {
        name: "fund-bond",
        args: [`u${amount}`],
      },
    });
    await tx.sign(sender);
    return client.submitTransaction(tx);
  };

  const claimBond = async (ids: number[], sender: string) => {
    const idsString = ids.map((id) => id.toString()).join(" u");
    const tx = await client.createTransaction({
      method: {
        name: "claim-bond",
        args: [`(list u${idsString})`],
      },
    });
    await tx.sign(sender);
    return client.submitTransaction(tx);
  };

  const finalizePool = async (sender: string) => {
    const tx = await client.createTransaction({
      method: {
        name: "finalize-pool",
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
          name: "get-nft-meta",
          args: [],
        },
      });
      tx.sign(ADDR1);
      await client.submitTransaction(tx);
    }
  };

  const getBalance = async (address: string) => {
    return client.provider.eval(
      poolContractId,
      `(stx-get-balance '${address})`
    );
  };

  it("should have a valid syntax", async () => {
    await client.checkContract();
  });

  describe("boom nfts deployed", async () => {
    before(async () => {
      const receipt = await client.deployContract();
      expect(receipt.success, JSON.stringify(receipt)).to.be.true
    });

    it("should mint nft", async () => {
      const result = await joinPool(ADDR1, 10000, 100);
      expect(result.success).is.true;
      expect(result.result).to.startWith(
        "Transaction executed and committed. Returned: true"
      );
      const owner1 = await getOwner(1);
      expect(owner1.success).is.true;
      expect(owner1.result).is.equal(`(ok (some ${ADDR1}))`);
    });

    it("should transfer an nft", async () => {
      const result = await transfer(1, ADDR1, ADDR2);
      expect(result.success).is.true;
      expect(result.result).to.startWith(
        "Transaction executed and committed. Returned: true"
      );
    });

    it("should not transfer an nft unauthorized", async () => {
      const result = await transfer(1, ADDR1, ADDR3);
      expect(result.success).is.false;
      expect(result.error.commandOutput).is.equal(
        'Aborted: u401'
      );
    });

    it("should return correct owner", async () => {
      const owner1 = await getOwner(1);
      expect(owner1.success).is.true;
      expect(owner1.result).is.equal(`(ok (some ${ADDR2}))`);
      const owner3 = await getOwner(100);
      expect(owner3.success).is.true;
      expect(owner3.result).is.equal(`(ok none)`);
    });

    it("should return meta data", async () => {
      const meta = await getMeta();
      expect(JSON.stringify(meta)).is.equal(
        '{"success":true,"result":"(tuple (mime-type \\"image/png\\") (name \\"Boom Stacking Pool Beta\\") (uri \\"https://boom.money/images/boom-pool.png\\"))","debugOutput":""}'
      );
    });

    it("should return the correct last token id", async () => {
      const lastId = await getLastTokenId();
      expect(lastId.success, JSON.stringify(lastId)).to.be.true;
      expect(JSON.stringify(lastId.result)).is.equal('"(ok u1)"');
    });

    it("should mint nft even though user owns one already", async () => {
      const result = await joinPool(ADDR2, 20000, 100);
      expect(result.success).is.true;
      expect(result.result).to.startWith(
        "Transaction executed and committed. Returned: true"
      );
      const owner2 = await getOwner(2);
      expect(owner2.success).is.true;
      expect(owner2.result).is.equal(`(ok (some ${ADDR2}))`);
    });

    it("should not mint another nft when user stacks already", async () => {
      const result = await joinPool(ADDR2, 10000, 100);
      expect(result.success).is.true;
      expect(result.result).to.startWith(
        "Transaction executed and committed. Returned: true"
      );
      const lastId = await getLastTokenId();
      expect(lastId.success, JSON.stringify(lastId)).to.be.true;
      expect(JSON.stringify(lastId.result)).is.equal('"(ok u2)"');
    });

    it("should return the correct last token id", async () => {
      const lastId = await getLastTokenId();
      expect(lastId.success, JSON.stringify(lastId)).to.be.true;
      expect(JSON.stringify(lastId.result)).is.equal('"(ok u2)"');
    });

    it("should payout", async () => {
      const result = await payout(10, [1, 2, 3], ADDR3);
      expect(result.success, JSON.stringify(result)).is.true;
      expect(result.result).to.startWith(
        `Transaction executed and committed. Returned: (tuple (result ((ok true) (ok true) (err u12))) (reward-ustx u10) (stx-from ${ADDR3}) (total-ustx u20000))`
      );
      const balance2 = await getBalance(ADDR2);
      expect(balance2.result).to.equal("u20010");
      const balance3 = await getBalance(ADDR3);
      expect(balance3.result).to.equal("u9990"); // initial balance - reward
      const balance4 = await getBalance(ADDR4);
      expect(balance4.result).to.equal("u10000"); // initial balance - bond + bond
    });
  });
});
