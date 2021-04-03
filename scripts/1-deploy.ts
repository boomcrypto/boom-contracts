import { deployContract, processing } from "../test/deploy";
import { contractName, contractOwner } from "./0-config";

async function deploy() {
  const result = await deployContract(
    contractName,
    "./contracts/boomboxes.clar",
    (s) =>
      s
        .replace(
          /ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM4DF2YCW/g,
          "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9"
        )
        .replace(
          /ST000000000000000000002AMW42H/g,
          "SP000000000000000000002Q6VF78"
        )
        .replace(
          /https:\/\/boom.money\/images\/boom-pool.svg/g,
          "https://boom-nft-41369b66-36da-4442-be60-fff6d755b065.s3.amazonaws.com/24762181-0ba6-4c5b-9065-1c874fb334d2.svg"
        ),
    contractOwner.private
  );
  await processing(result);
}

deploy();
