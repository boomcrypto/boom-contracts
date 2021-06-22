import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v0.10.0/index.ts";
import { assertEquals } from "https://deno.land/std@0.98.0/testing/asserts.ts";

function mintNFT(
  account: Account,
  seriesName: string,
  seriesUri: string,
  nfts: any[]
) {
  return Tx.contractCall(
    "boom-nfts",
    "mint-series",
    [
      types.principal(account.address), // creator
      types.none(), // creator-name
      types.none(), // exsiting-series-id
      types.utf8(seriesName),
      types.ascii(seriesUri),
      types.ascii("image/png"),
      types.list(nfts),
    ],
    account.address
  );
}
Clarinet.test({
  name: "Ensure that user can mint",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      mintNFT(wallet_1, "Test nfts", "https://randomseriesimage.com/1", [
        types.tuple({
          name: types.utf8("nft1"),
          number: types.uint(1),
          uri: types.ascii("https://randomimage.com/1"),
          "mime-type": types.ascii("image/png"),
          hash: "0x",
        }),
        types.tuple({
          name: types.utf8("nft2"),
          number: types.uint(2),
          uri: types.ascii("https://randomimage.com/2"),
          "mime-type": types.ascii("image/png"),
          hash: "0x",
        }),
      ]),
    ]);
    assertEquals(block.height, 2);
    const result = block.receipts[0].result.expectOk().expectTuple() as any;
    result.count.expectUint(2);
    result["series-id"].expectUint(1);
    const ids = result.ids.expectList();
    ids[0].expectUint(1);
    ids[1].expectUint(2);
  },
});
