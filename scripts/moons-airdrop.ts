import * as Data from './data.json';
import fs from 'fs';

const MAX = 644;

const availableTokens = Array.from(Array(MAX).keys());

const randomNFT = (max = MAX) => {
  return Math.floor(Math.random() * max);
};

const appendToFile = (filename: string, content: string) => {
  fs.appendFile(filename, content, err => {
    if (err) {
      console.error(err);
    }
  });
};

const createFile = (filename: string) => {
  fs.writeFile(filename, '', err => {
    if (err) {
      console.error(err);
    }
  });
};

let counter = 0;
const filename = 'receipeints.log';
createFile(filename);

const recipientsList = [...new Set(Data.recipient)];

recipientsList.map(recipient => {
  for (let index = 0; index < 4; index++) {
    let rndm = randomNFT(availableTokens.length);

    const removedId = availableTokens.splice(rndm, 1);
    console.log('random Index:', rndm, 'removed array:', removedId.toString());

    counter++;
    const content = `(mint '${recipient} u${removedId[0]})\n`;
    appendToFile(filename, content);
  }
});

console.log(':: MINTED IN TOTAL ::', counter);
