(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)
(define-non-fungible-token b-18 uint)
(define-constant dplyr tx-sender) ;; dplyr not used

(define-constant accnt (as-contract tx-sender))
(define-constant px-addr {hashbytes: 0x13effebe0ea4bb45e35694f5a15bb5b96e851afb, version: 0x01})
(define-constant minimum-amount u40000000)
(define-constant time-limit u703550) ;; add 4200 blocks

(define-data-var last-id uint u0)
(define-data-var start (optional uint) none)
(define-data-var total-stacked uint u0)

(define-map meta uint
  (tuple
    (stacker principal)
    (amount-ustx uint)
    (until-burn-ht (optional uint))
    (stacked-ustx (optional uint))
    (reward (optional uint))))

(define-map lookup principal uint)


(define-private (pox-delegate-stx-and-stack (amount-ustx uint) (until-burn-ht (optional uint)))
  (begin
    (let ((ignore-result-revoke (contract-call? 'SP000000000000000000002Q6VF78.pox revoke-delegate-stx))
          (start-block-ht (+ burn-block-height u1))
          (locking-cycles u1))
      (match (contract-call? 'SP000000000000000000002Q6VF78.pox delegate-stx amount-ustx accnt until-burn-ht none)
        success
          (let ((stacker tx-sender))
            (match (as-contract (contract-call? 'SP000000000000000000002Q6VF78.pox delegate-stack-stx stacker amount-ustx px-addr start-block-ht locking-cycles))
              stack-success (ok stack-success)
              stack-error (print (err (to-uint stack-error)))))
        error (err (to-uint error))))))

(define-private (mint-and-delegatedly-stack (stacker principal) (amount-ustx uint) (until-burn-ht (optional uint)))
  (let
    ((id (+ u1 (var-get last-id))))
      (asserts! (>= amount-ustx minimum-amount) err-delegate-below-minimum)
      (asserts! (< burn-block-height time-limit) err-delegate-too-late)
      (asserts! (>= (stx-get-balance tx-sender) amount-ustx) err-not-enough-funds)      
      (var-set last-id id)
      (match (pox-delegate-stx-and-stack amount-ustx until-burn-ht)
        success-pox
            (match (nft-mint? b-18 id stacker)
              success-mint
                (begin
                  (asserts! (map-insert lookup stacker id) err-map-function-failed)
                  (asserts! (map-insert meta id
                      {stacker: stacker, amount-ustx: amount-ustx, stacked-ustx: (some (get lock-amount success-pox)), until-burn-ht: until-burn-ht, reward: none})
                      err-map-function-failed)
                  (ok {id: id, pox: success-pox}))
              error-minting (err-nft-mint error-minting))
        error-pox (err error-pox))))

(define-public (delegate-stx (amount-ustx uint) (stacker principal) (until-burn-ht (optional uint)) (pox-addr (optional (tuple (hashbytes (buff 20)) (version (buff 1))))))
  (if (and
        (or (is-eq stacker tx-sender) (is-eq stacker contract-caller)) 
        (is-none (map-get? lookup stacker)))
        (begin 
          (var-set total-stacked (+ (var-get total-stacked) amount-ustx))
          (mint-and-delegatedly-stack stacker amount-ustx until-burn-ht))
      
    err-delegate-invalid-stacker))

;; function for pool admins
(define-private (get-total (stack-result (response (tuple (lock-amount uint) (stacker principal) (unlock-burn-height uint)) (tuple (kind (string-ascii 32)) (code uint))))
    (total uint))
  (match stack-result
    details (+ total (get lock-amount details))
    error total))

(define-private (update-meta (id uint) (stacked-ustx uint))
  (match (map-get? meta id)
    entry (map-set meta id {
      stacker: (get stacker entry),
      amount-ustx: (get amount-ustx entry),
      until-burn-ht: (get until-burn-ht entry),
      stacked-ustx: (some stacked-ustx),
      reward: (get reward entry)})
    false))

(define-public (stack-aggregation-commit (reward-cycle uint))
  (if (> burn-block-height time-limit)
    (match (as-contract (contract-call? 'SP000000000000000000002Q6VF78.pox stack-aggregation-commit px-addr reward-cycle))
      success (ok success)
      error (err-pox-stack-aggregation-commit error))
    err-commit-too-early))


(define-read-only (nft-details (nft-id uint))
  (ok {stacked-ustx: (unwrap! (unwrap! (get stacked-ustx (map-get? meta nft-id)) err-invalid-asset-id) err-invalid-asset-id),
        owner: (unwrap! (nft-get-owner? b-18 nft-id) err-no-asset-owner)}))

(define-read-only (nft-details-at-block (nft-id uint) (stacks-tip uint))
  (match (get-block-info? id-header-hash stacks-tip)
    ihh (print (at-block (print ihh) (nft-details nft-id)))
    err-invalid-stacks-tip))

(define-private (payout-nft (nft-id uint) (ctx (tuple (reward-ustx uint) (total-ustx uint) (stx-from principal) (pay-stacks-tip uint) (result (list 750 (response bool uint))))))
  (let ((reward-ustx (get reward-ustx ctx))
      (total-ustx (get total-ustx ctx))
      (stx-from (get stx-from ctx))
      (stacks-tip (get pay-stacks-tip ctx)))
    (let (
      (transfer-result
          (match (nft-details-at-block nft-id stacks-tip)
            entry (let ((reward-amount (/ (* reward-ustx  (get stacked-ustx entry)) total-ustx)))
                    (match (stx-transfer? reward-amount stx-from (get owner entry))
                      success-stx-transfer (ok true)
                      error-stx-transfer (err-stx-transfer error-stx-transfer)))
            error (err error))))
      {reward-ustx: reward-ustx, total-ustx: total-ustx, stx-from: stx-from, pay-stacks-tip: stacks-tip,
        result: (unwrap-panic (as-max-len? (append (get result ctx) transfer-result) u750))})))

(define-private (sum-stacked-ustx (nft-id uint) (total uint))
  (match (map-get? meta nft-id)
    entry (match (get stacked-ustx entry)
            amount (+ total amount)
            total)
    total))

(define-read-only (get-total-stacked-ustx (nfts (list 750 uint)))
  (fold sum-stacked-ustx nfts u0))

(define-read-only (get-total-stacked-ustx-at-block (nfts (list 750 uint)) (stacks-tip uint))
  (match (get-block-info? id-header-hash stacks-tip)
    ihh (at-block ihh (ok (get-total-stacked-ustx nfts)))
    err-invalid-stacks-tip))

(define-public (payout (reward-ustx uint) (nfts (list 750 uint)) (pay-stacks-tip uint))
  (match (get-total-stacked-ustx-at-block nfts pay-stacks-tip)
    total-ustx (ok (fold payout-nft nfts {reward-ustx: reward-ustx, total-ustx: total-ustx, stx-from: tx-sender, pay-stacks-tip: pay-stacks-tip, result: (list)}))
    error (err error)))

(define-read-only (get-total-stacked)
  (var-get total-stacked))

(define-public (allow-contract-caller (this-contract principal))
  (if (is-eq tx-sender dplyr)
    (as-contract (contract-call? 'SP000000000000000000002Q6VF78.pox allow-contract-caller this-contract none))
    (err 403)))

;; NFT functions
(define-public (transfer (id uint) (sender principal) (recipient principal))
  (if (or (is-eq sender tx-sender) (is-eq sender contract-caller))
    (match (nft-transfer? b-18 id sender recipient)
      success (ok success)
      error (err-nft-transfer error))
    err-not-allowed-sender))

(define-read-only (get-owner (id uint))
  (ok (nft-get-owner? b-18 id)))

(define-read-only (get-owner-raw? (id uint))
  (nft-get-owner? b-18 id))

(define-read-only (get-last-token-id)
  (ok (var-get last-id)))

(define-read-only  (last-token-id-raw)
  (var-get last-id))

(define-read-only (get-token-uri (id uint))
  (ok (some "https://cloudflare-ipfs.com/ipfs/bafkreifoptedewjxd4vk4hhnd7teewwpauifowgzktkmmpif4wejd36jr4")))


;; error handling
(define-constant err-nft-not-owned (err u401)) ;; unauthorized
(define-constant err-not-allowed-sender (err u403)) ;; forbidden
(define-constant err-nft-not-found (err u404)) ;; not found
(define-constant err-sender-equals-recipient (err u405)) ;; method not allowed
(define-constant err-nft-exists (err u409)) ;; conflict
(define-constant err-not-enough-funds (err u4021)) ;; payment required
(define-constant err-amount-not-positive (err u4022)) ;; payment required

(define-constant err-map-function-failed (err u601))
(define-constant err-invalid-asset-id (err u602))
(define-constant err-no-asset-owner (err u603))
(define-constant err-delegate-below-minimum (err u604))
(define-constant err-delegate-invalid-stacker (err u605))
(define-constant err-delegate-too-late (err u606))
(define-constant err-commit-too-early (err u607))
(define-constant err-invalid-stacks-tip (err u608))

(define-map err-strings (response uint uint) (string-ascii 32))
(map-insert err-strings err-nft-not-owned "nft-not-owned")
(map-insert err-strings err-not-allowed-sender "not-allowed-sender")
(map-insert err-strings err-nft-not-found "nft-not-found")
(map-insert err-strings err-sender-equals-recipient "sender-equals-recipient")
(map-insert err-strings err-nft-exists "nft-exists")
(map-insert err-strings err-map-function-failed "map-function-failed")
(map-insert err-strings err-invalid-asset-id "invalid-asset-id")
(map-insert err-strings err-no-asset-owner "no-asset-owner")
(map-insert err-strings err-delegate-below-minimum "delegate-below-minimum")
(map-insert err-strings err-delegate-invalid-stacker "delegate-invalid-stacker")
(map-insert err-strings err-delegate-too-late "delegate-too-late")
(map-insert err-strings err-commit-too-early "commit-too-early")
(map-insert err-strings err-invalid-stacks-tip "invalid-stacks-tip")

(define-private (err-pox-stack-aggregation-commit (code int))
  (err (to-uint (* 1000 code))))

(define-private (err-stx-transfer (code uint))
  (if (is-eq u1 code)
    err-not-enough-funds
    (if (is-eq u2 code)
      err-sender-equals-recipient
      (if (is-eq u3 code)
        err-amount-not-positive
        (if (is-eq u4 code)
          err-not-allowed-sender
          (err code))))))

(define-private (err-nft-transfer (code uint))
  (if (is-eq u1 code)
    err-nft-not-owned
    (if (is-eq u2 code)
      err-sender-equals-recipient
      (if (is-eq u3 code)
        err-nft-not-found
        (err code)))))

(define-private (err-nft-mint (code uint))
  (if (is-eq u1 code)
    err-nft-exists
    (err code)))

(define-read-only (get-errstr (code uint))
  (unwrap! (map-get? err-strings (err code)) "unknown-error"))
