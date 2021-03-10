;;(impl-trait 'ST314JC8J24YWNVAEJJHQXS5Q4S9DX1FW5Z9DK9NT.nft-trait.stacks-token-nft-standard-v1)
(define-non-fungible-token boom-pool-beta uint)
(define-constant pool-account tx-sender)
(define-constant prepare-phase-length u10)
(define-constant reward-cycle-length u50)
(define-constant grace-period-length u10)

(define-constant err-map-function-failed u10)
(define-constant err-var-set-failed u11)
(define-constant err-invalid-asset-id u12)
(define-constant err-no-asset-owner u13)
(define-constant err-call-not-allowed u14)
(define-constant err-delegate-below-minimum u15)
(define-constant err-delegate-invalid-stacker u16)
(define-constant err-invalid-claim u17)

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

(define-private (new-stacker-delegate-stx (stacker principal) (amount-ustx uint) (until-burn-ht (optional uint)) (pox-addr (optional (tuple (hashbytes (buff 20)) (version (buff 1))))))
  (let
    ((id (+ u1 (var-get last-id))))
      (var-set last-id id)
      (match (pox-delegate-stx amount-ustx until-burn-ht)
        success-pox
            (match (nft-mint? boom-pool-beta id stacker)
              success-mint
                (begin
                  (map-insert lookup stacker id)
                  (if (map-insert meta id
                      {stacker: stacker, amount-ustx: amount-ustx, stacked-ustx: none, until-burn-ht: until-burn-ht, reward: none})
                    (ok true)
                    (err err-map-function-failed)))
              error-minting (err error-minting))
        error-pox (err error-pox))))


(define-private (old-stacker-delegate-stx (stacker-id uint) (stacker principal) (amount-ustx uint) (until-burn-ht (optional uint)) (pox-addr (optional (tuple (hashbytes (buff 20)) (version (buff 1))))))
  (match (pox-delegate-stx amount-ustx until-burn-ht)
    success-pox
      (if (map-set meta stacker-id
                {stacker: stacker, amount-ustx: amount-ustx, stacked-ustx: none, until-burn-ht: until-burn-ht, reward: none})
        (ok true)
        (err err-map-function-failed))
    error-pox (err error-pox)))

(define-private (pox-delegate-stx (amount-ustx uint) (until-burn-ht (optional uint)))
  (if (> amount-ustx u100)
    (let ((result-revoke (contract-call? 'ST000000000000000000002AMW42H.pox revoke-delegate-stx)))
      (match (contract-call? 'ST000000000000000000002AMW42H.pox delegate-stx amount-ustx pool-account until-burn-ht none)
        success (ok success)
        error (err (to-uint error))
      ))
    (err err-delegate-below-minimum)))

(define-public (delegate-stx (stacker principal) (amount-ustx uint) (until-burn-ht (optional uint)) (pox-addr (optional (tuple (hashbytes (buff 20)) (version (buff 1))))))
  (if (or (is-eq stacker tx-sender) (is-eq stacker contract-caller))
    (match (map-get? lookup stacker)
      stacker-id (old-stacker-delegate-stx stacker-id stacker amount-ustx until-burn-ht pox-addr)
      (new-stacker-delegate-stx stacker amount-ustx until-burn-ht pox-addr))
    (err err-delegate-invalid-stacker)))

;; function for pool admins
(define-private (get-total (stack-result (response (tuple (lock-amount uint) (stacker principal) (unlock-burn-height uint)) (tuple (kind (string-ascii 32)) (code uint))))
    (total uint))
  (match stack-result
    details (+ total (get lock-amount details))
    error total))

(define-private (get-stack-amount (entry (tuple
    (stacker principal)
    (amount-ustx uint)
    (until-burn-ht (optional uint))
    (stacked-ustx (optional uint))
    (reward (optional uint)))))
  (let ((balance (stx-get-balance (get stacker entry)))
      (amount-ustx (get amount-ustx entry)))
        (if (< balance amount-ustx)
          balance
          amount-ustx)))

(define-private (update-meta (id uint) (stacked-ustx uint))
  (match (map-get? meta id)
    entry (map-set meta id {
      stacker: (get stacker entry),
      amount-ustx: (get amount-ustx entry),
      until-burn-ht: (get until-burn-ht entry),
      stacked-ustx: (some stacked-ustx),
      reward: (get reward entry)})
    false))

(define-private (delegate-stack-stx (nft uint) (context (tuple
                      (start-burn-ht uint)
                      (pox-address (tuple (hashbytes (buff 20)) (version (buff 1))))
                      (lock-period uint)
                      (result (list 750 (response (tuple (lock-amount uint) (stacker principal) (unlock-burn-height uint)) (tuple (kind (string-ascii 32)) (code uint))))))))
  (let
    ((pox-address (get pox-address context))
    (start-burn-ht (get start-burn-ht context))
    (lock-period (get lock-period context)))
  (let ((stack-result (match (map-get? meta nft)
    entry (let ((stack-amount (get-stack-amount entry)))
            (if (update-meta nft stack-amount)
              (match (contract-call? 'ST000000000000000000002AMW42H.pox delegate-stack-stx
                          (get stacker entry)
                          stack-amount
                          pox-address start-burn-ht lock-period)
                stacker-details (ok stacker-details)
                error (err {kind: "native-function-failed", code: (to-uint error)}))
              (err {kind: "native-map-insert-failed", code: nft})))
    (err {kind: "invalid-argument", code: err-invalid-asset-id}))))
  {pox-address: pox-address,
    start-burn-ht: start-burn-ht,
    lock-period: lock-period,
    result: (unwrap-panic (as-max-len? (append (get result context) stack-result) u750))})))

(define-public (delegate-stack-stx-and-commit (nfts (list 750 uint))
          (pox-address (tuple (hashbytes (buff 20)) (version (buff 1))))
          (start-burn-ht uint) (lock-period uint) (reward-cycle uint))
  (begin
    (var-set start (some start-burn-ht))
    (let ((details (get result (fold delegate-stack-stx nfts {pox-address: pox-address, start-burn-ht: start-burn-ht, lock-period: lock-period, result: (list)}))))
      (let ((total (fold get-total details u0)))
        (if (var-set total-stacked total)
          (match (contract-call? 'ST000000000000000000002AMW42H.pox stack-aggregation-commit pox-address reward-cycle)
            success (ok success)
            error (err {kind: "native-pox-failed", code: (to-uint error), details: details}))
          (err {kind: "native-var-set-failed", code: err-var-set-failed, details: details}))))))

(define-read-only (nft-details (nft-id uint))
  (ok {amount-ustx: (unwrap! (get amount-ustx (map-get? meta nft-id)) (err err-invalid-asset-id)),
        owner: (unwrap! (nft-get-owner? boom-pool-beta nft-id) (err err-no-asset-owner))}))

(define-private (payout-nft (nft-id uint) (context (tuple (reward-ustx uint) (total-ustx uint) (stx-from principal) (result (list 750 (response bool uint))))))
  (let ((reward-ustx (get reward-ustx context))
      (total-ustx (get total-ustx context))
      (stx-from (get stx-from context)))
    (let (
      (transfer-result
          (match (nft-details nft-id)
            entry (let ((reward-amount (/ (* reward-ustx  (get amount-ustx entry)) total-ustx)))
                    (stx-transfer? reward-amount stx-from (get owner entry)))
            error (err error))))
      {reward-ustx: reward-ustx, total-ustx: total-ustx, stx-from: stx-from,
        result: (unwrap-panic (as-max-len? (append (get result context) transfer-result) u750))})))

(define-read-only (end-of-cycle)
  (+ (unwrap-panic (var-get start)) reward-cycle-length prepare-phase-length))

(define-private (sum-stacked-ustx (nft-id uint) (total uint))
  (match (map-get? meta nft-id)
    entry (match (get stacked-ustx entry)
            amount (+ total amount)
            total)
    total))

(define-read-only (get-total-stacked-ustx (nfts (list 750 uint)))
  (fold sum-stacked-ustx nfts u0)
)

(define-public (payout (reward-ustx uint) (nfts (list 750 uint)))
  (if (and (> burn-block-height (end-of-cycle)) (>= reward-ustx (stx-get-balance (as-contract tx-sender))))
      (let ((total-ustx (get-total-stacked-ustx nfts)))
        (let ((result (ok (fold payout-nft nfts {reward-ustx: reward-ustx, total-ustx: total-ustx, stx-from: tx-sender, result: (list)})))
          (contract-balance (as-contract (stx-get-balance tx-sender)))
        )
          (if (> contract-balance u0)
            (match (as-contract (stx-transfer? (stx-get-balance tx-sender) tx-sender pool-account))
              success result
              error (err error))
            result
          )))
    (err err-call-not-allowed)))

(define-read-only (get-total-stacked)
  (var-get total-stacked))

;; function for bond
(define-public (fund-bond (amount uint))
  (stx-transfer? amount tx-sender (as-contract tx-sender)))

(define-read-only (valid-claim (nfts (list 750 uint)))
  (let ((nfts-total-ustx (get-total-stacked-ustx nfts))
      (total-ustx (var-get total-stacked)))
    (is-eq (print nfts-total-ustx) (print total-ustx))))

(define-public (claim-bond (nfts (list 750 uint)))
  (if (> burn-block-height (+ (end-of-cycle) grace-period-length))
    (begin
      (let ((total-ustx (print (get-total-stacked-ustx nfts))))
        (if (valid-claim nfts)
          (ok (fold payout-nft nfts {reward-ustx: (stx-get-balance (as-contract tx-sender)), total-ustx: total-ustx, stx-from: (as-contract tx-sender), result: (list)}))
          (err err-invalid-claim))))
    (err err-call-not-allowed)))

(define-public (finalize-pool)
  (if (> burn-block-height (+ (end-of-cycle) (* u2 grace-period-length)))
    (let ((balance (stx-get-balance (as-contract tx-sender))))
      (if (> balance u0)
        (as-contract (stx-transfer? balance tx-sender pool-account))
        (ok true)))
    (err err-call-not-allowed)))

;; NFT functions

;; error codes
;; (err u1) -- sender does not own the asset
;; (err u2) -- sender and recipient are the same principal
;; (err u3) -- asset identified by asset-identifier does not exist
;; (err u4) -- sender is not tx sender or contract caller
(define-public (transfer (id uint) (sender principal) (recipient principal))
  (if (or (is-eq sender tx-sender) (is-eq sender contract-caller))
    (match (nft-transfer? boom-pool-beta id sender recipient)
      success (ok success)
      error (err {kind: "nft-transfer-failed", code: error}))
    (err {kind: "permission-denied", code: err-call-not-allowed})))

(define-read-only (get-owner (id uint))
  (ok (nft-get-owner? boom-pool-beta id)))

(define-read-only (get-owner-raw? (id uint))
  (nft-get-owner? boom-pool-beta id))

(define-read-only (get-nft-meta)
  {uri: "https://boom.money/images/boom-pool.png", name: "Boom Stacking Pool Beta", mime-type: "image/png"})

(define-read-only (get-last-token-id)
  (ok (var-get last-id)))

(define-read-only  (last-token-id-raw)
  (var-get last-id))
