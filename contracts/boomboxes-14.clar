(impl-trait 'ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM4DF2YCW.nft-trait.nft-trait)
(define-non-fungible-token b-14 uint)
;; (define-constant dplyr tx-sender) ;; dplyr not used
(define-constant accnt (as-contract tx-sender))
(define-constant px-addr {hashbytes: 0x13effebe0ea4bb45e35694f5a15bb5b96e851afb, version: 0x01})
(define-constant minimum-amount u100000000)
(define-constant time-limit u694950) ;; add 4000 blocks?

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
            (match (nft-mint? b-12 id stacker)
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
      (mint-and-delegatedly-stack stacker amount-ustx until-burn-ht)
    err-delegate-invalid-stacker))


;; NFT functions
(define-public (transfer (id uint) (sender principal) (recipient principal))
  (if (or (is-eq sender tx-sender) (is-eq sender contract-caller))
    (match (nft-transfer? b-12 id sender recipient)
      success (ok success)
      error (err-nft-transfer error))
    err-not-allowed-sender))

(define-read-only (get-owner (id uint))
  (ok (nft-get-owner? b-12 id)))

(define-read-only (get-owner-raw? (id uint))
  (nft-get-owner? b-12 id))

(define-read-only (get-last-token-id)
  (ok (var-get last-id)))

(define-read-only  (last-token-id-raw)
  (var-get last-id))

(define-read-only (get-token-uri (id uint))
  (ok (some "https://bafkreicgdpmukjc6lp7vhnchf3sma6chmduaafqmywswkwh6a6ygejk5nu.ipfs.dweb.link/")))


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