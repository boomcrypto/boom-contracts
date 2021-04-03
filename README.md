# Clarity Contract for Community Stacking Pool

The [Stacks blockchain](https://stacks.co) provides functions so that everybody can participate in proof of transfer. For users with STX holdings below the required minimum, it is possible to build a pool. This repo provides a contract for a community stacking pool.

## Public functions for users

### Delegate Stacks

`delegate-stx` has the same function signature as the pox contract. It is used by delegatees to give the pool operator the rights to stack their holdings.

```
(define-public (delegate-stx (stacker principal) (amount-ustx uint) (until-burn-ht (optional uint)) (pox-addr (optional (tuple (hashbytes (buff 20)) (version (buff 1)))))))
```

### Transfer Reward NFT

Transfers the stacking nft. The owner of the nft is rewarded when the operator does the payout.

```
(define-public (transfer (id uint) (sender principal) (recipient principal)))
```

## Public functions for pool operators

### Stack Stacks and Commit

Once all users have delegated the right to stack, the pool operator performs the stacking.

```
(define-public (delegate-stack-stx-and-commit (nfts (list 750 uint))
          (pox-address (tuple (hashbytes (buff 20)) (version (buff 1))))
          (start-burn-ht uint) (lock-period uint) (reward-cycle uint)))
```

### Payout

Once the BTC rewards are received and the are converted to STX, the pool operator pays the users. The pool operator has to provide the correct list of nfts that participated in the pooling. The reward must be higher than the bond.

```
(define-public (payout (reward-ustx uint) (nfts (list 750 uint))))
```

## Public functions for the bond

To build trust, pool operators can fund a bond that users can claim in case the pool operator does not do the payout.

```
(define-public (fund-bond (amount uint)))
```

Users can claim the bond after the reward cycle has ended and the grace period has passed. The user has to provide the correct list of nfts that participated in the pooling.

```
(define-public (claim-bond (nfts (list 750 uint))))
```

When the pool is not used anymore, all remaining funds can be transferred to the pool operator.
The pool can only be finalized after the reward cycle has ended and twice the grace period has past.

```
(define-public (finalize-pool))
```
