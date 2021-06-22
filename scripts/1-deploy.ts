import { deployContract, processing } from "../test/deploy";
import { contractFilePath, contractName, contractOwner, imageUri } from "./0-config";

async function deploy() {
  const result = await deployContract(
    contractName,
    contractFilePath,
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
        .replace(/https:\/\/boom.money\/images\/boom-pool.svg/g, imageUri),
    contractOwner.private
  );
  await processing(result);
}

deploy();
