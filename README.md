# Clarity Contracts developed and used by Boom

This repository contains the currently used and developed smart contracts for boom.money.

The `main` branch contains the current development code with tests.

The `mainnet` branch contains the source code for contracts deployed on mainnet.

The `testnet` branch contains the source code for contracts deployed on testnet.

The branches for mainnet and testnet contracts contain a script `getSource` that allows to easily pull the source code from the network. Just run `yarn start` after editing `getSource.mjs`.
## Boomboxes

The [Stacks blockchain](https://stacks.co) provides functions so that everybody can participate in proof of transfer. For users with STX holdings below the required minimum, it is possible to build a pool. This repo provides a contract for a community stacking pool that is managed by a smart contract. The smart contract creates NFTs for stackers.

## Public functions for users

### Delegate Stacks

`delegate-stx` has the same function signature as the pox contract. It is used by delegators to give the pool operator the rights to stack their holdings. As the operator is a contract, this transaction also executes the stacking by the operator (`delegate-stack-stx`).

```
(define-public (delegate-stx (stacker principal) (amount-ustx uint) (until-burn-ht (optional uint)) (pox-addr (optional (tuple (hashbytes (buff 20)) (version (buff 1)))))))
```

### Stacks Aggregation Commit

### Transfer Reward NFT

Transfers the stacking nft. The owner of the nft is rewarded when anybody does the payout.

```
(define-public (transfer (id uint) (sender principal) (recipient principal)))
```

### Payout

Once the BTC rewards are received and the are converted to STX, the pool operator pays the users. The pool operator has to provide a list of nfts that participated in the pooling. Anybody can call this function.

### Admin functions

```
(define-public (payout (reward-ustx uint) (nfts (list 750 uint))))
```

## Content of This Repository

* Airdrop moon (`airdrop-moon`)

Contracts for the Moon NFTs airdropped to Moonbox Boombox (cycle #28) holders on August 23, 2022 during cycle #40.

* Boom NFTs (`boom-nfts`)
  
Contracts for Boom NFTs that can be minted one boom.money. NFTs are grouped together via a collection id.

* Boombox NFTs (`boombox`)
  
Contract for Boombox NFTs that represent future stacking rewards. They are minted via Boombox Admin contract.

* Boombox Admin (`boombox-admin`)
  
Contract managing stacking via NFTs. The admin contract can handle several NFTs for each cycle. The NFT contract defines the bitcoin reward address. Boombox NFTs use this contract.

* Boomtree (`boomtree`)
  
* Common (`common`)

Generic contracts like fungible tokens mainly used for testing

* Friedger Pool Extras (`friedger-pool-extras`)

Contracts helping managing or using the non-custodial stacking pool "Friedger Pool".

* Group Stacker (`group-stacker`)

Contract for handling funds from users for stacking purposes using a Boombox. Based on earlier work of [cooperative stacking](https://github.com/hozzjss/cooperative-stacking).

* Marketplace (`marketplace`)
  
Contract for custodial marketplace using escrow during listing.