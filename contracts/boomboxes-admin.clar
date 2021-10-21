;;(impl-trait 'ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM4DF2YCW.nft-trait.nft-trait)

(define-constant dplyr tx-sender) 
(define-constant accnt (as-contract tx-sender))
;; (define-constant px-addr {hashbytes: 0x13effebe0ea4bb45e35694f5a15bb5b96e851afb, version: 0x01}) ;; how do we want to manage this?

(define-data-var last-id uint u0)
(define-data-var start (optional uint) none)
(define-data-var total-stacked uint u0)

(define-map boombox uint 
  (tuple 
    (contractId string-ascii) ;; not sure how this should be entered
    (cycle uint)
    (minimum-amount uint)
    (time-limit uint)
    (owner principal)))

;; @desc adds a boombox contract to the list of boomboxes
;; @param contractId; The NFT contract for this boombox
;; @param cycle; PoX reward cycle
;; @param minimum-amount; minimum stacking amount for this boombox
;; @param time-limit; block at which minting should stop
;; @param owner; owner/admin of this boombox
;; @param px-addr; reward pool address
(define-private (add-boombox (contractId string-ascii) (cycle uint) (minimum-amount uint) (time-limit uint) (owner principal))
  (begin
    (id (+ 1 (var-get last-id)))
    (asserts! boombox-unique (err err-nft-exists)) ;; does it make sense to use u409 here?
    (map-insert boombox id 
      {contractId: contractId, cycle: cycle, minimum-amount: minimum-amout, time-limit: time-limit, owner: owner } err-map-function-failed)))

;; @desc stops minting of a boombox
;; @param id; the boombox id
(define-private (halt-boombox id) 
  (begin
    ;; TODO: check contract-caller is boombox owner
    (map-delete boombox id err-map-function-failed))) ;; TODO: add a more specific error
)

;; @desc lookup a boombox by id
;; @param id; the boombox id
(define-private (get-boombox-by-id id) 
  (begin
    (map-get boombox id err-map-function-failed))) ;; TODO: add a more specific error

;; @desc lookup a boombox by id
;; @param id; the boombox id
;; (define-private (get-boombox-by-cycle (cycle uint)) 
;;   (begin
;;     (map-get boombox id err-map-function-failed))) ;; TODO: add a more specific error


;; (define-private (get-boombox-by-owner (owner principal)) body)
;; (define-private (get-boombox-by-owner-and-cycle (owner principal) (cycle uint)) body)
;; (define-private get-boombox-by-owner-and-cycle-and-id (owner principal) (cycle uint)  body)
;; (define-private get-boombox-by-minimum-amount body)
;; (define-private get-boombox-by-time-limit body)
;; (define-private boombox-unique body)
;; (define-private get-stackers-by-id body)
;; (define-private get-total-stacked-by-id body)

(define-map lookup principal uint) ;; not sure how this needs to be re-written

(define-private (pox-delegate-stx-and-stack (amount-ustx uint) (until-burn-ht (optional uint)))
  (begin
    (let ((ignore-result-revoke (contract-call? 'ST000000000000000000002AMW42H.pox revoke-delegate-stx))
          (start-block-ht (+ burn-block-height u1))
          (locking-cycles u1))
      (match (contract-call? 'ST000000000000000000002AMW42H.pox delegate-stx amount-ustx accnt until-burn-ht none)
        success
          (let ((stacker tx-sender))
            (match (as-contract (contract-call? 'ST000000000000000000002AMW42H.pox delegate-stack-stx stacker amount-ustx px-addr start-block-ht locking-cycles))
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

(define-public (stack-aggregation-commit (reward-cycle uint))
  (if (> burn-block-height time-limit)
    (match (as-contract (contract-call? 'ST000000000000000000002AMW42H.pox stack-aggregation-commit px-addr reward-cycle))
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
    (as-contract (contract-call? 'ST000000000000000000002AMW42H.pox allow-contract-caller this-contract none))
    (err 403)))


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