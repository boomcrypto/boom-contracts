# Clarity Contract for Boomboxes

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

```
(define-public (payout (reward-ustx uint) (nfts (list 750 uint))))
```