;; based on https://github.com/friedger/clarity-marketplace/blob/master/contracts/market.clar
;; and stxnft.com updates
;;

(use-trait tradables-trait .tradables-trait.tradables-trait)

(define-data-var minimum-commission uint u250) ;; minimum commission 1% by default
(define-data-var minimum-listing-price uint u1000000) ;; minimum listing price 1 STX
(define-data-var listings-frozen bool false) ;; turn off the ability to list additional NFTs

(define-map on-sale
  {tradables: principal, tradable-id: uint}
  {price: uint, commission: uint, owner: principal}
)

(define-map royalties
  {tradables: principal}
  {royalty-address: principal, royalty-percent: uint}
)

(define-constant contract-owner tx-sender)
(define-constant err-payment-failed u1)
(define-constant err-transfer-failed u2)
(define-constant err-not-allowed u3)
(define-constant err-duplicate-entry u4)
(define-constant err-tradable-not-found u5)
(define-constant err-commission-or-price-too-low u6)
(define-constant err-listings-frozen u7)
(define-constant err-commission-payment-failed u8)
(define-constant err-royalty-payment-failed u9)

(define-read-only (get-listing (tradables <tradables-trait>) (tradable-id uint))
  (match (map-get? on-sale {tradables: (contract-of tradables), tradable-id: tradable-id})
    nft-data
    (ok nft-data)
    (err err-tradable-not-found)
  )
)

(define-read-only (get-royalty-amount (contract principal))
  (match (map-get? royalties {tradables: contract})
    royalty-data
    (get royalty-percent royalty-data)
    u0)
)

(define-private (get-royalty (contract principal))
  (match (map-get? royalties {tradables: contract})
    royalty-data
    royalty-data
    {royalty-address: contract-owner, royalty-percent: u0})
)

(define-private (get-owner (tradables <tradables-trait>) (tradable-id uint))
  (contract-call? tradables get-owner tradable-id)
)

(define-private (transfer-tradable-to-escrow (tradables <tradables-trait>) (tradable-id uint))
  (begin
    (contract-call? tradables transfer tradable-id tx-sender (as-contract tx-sender))
  )
)

(define-private (transfer-tradable-from-escrow (tradables <tradables-trait>) (tradable-id uint))
  (let ((owner tx-sender))
    (begin
      (as-contract (contract-call? tradables transfer tradable-id (as-contract tx-sender) owner))
    )
  )
)

(define-private (return-tradable-from-escrow (tradables <tradables-trait>) (tradable-id uint))
  (match (map-get? on-sale {tradables: (contract-of tradables), tradable-id: tradable-id})
    nft-data
    (let ((owner tx-sender))
      (begin
        (as-contract (contract-call? tradables transfer tradable-id (as-contract tx-sender) (get owner nft-data)))
      )
    )
    (err err-tradable-not-found)
  )
)

(define-public (list-asset (tradables <tradables-trait>) (tradable-id uint) (price uint) (commission uint))
 (begin
  (asserts! (is-eq false (var-get listings-frozen)) (err err-listings-frozen))
  (let ((tradable-owner (unwrap! (unwrap-panic (get-owner tradables tradable-id)) (err err-tradable-not-found)))
       (royalty (get-royalty (contract-of tradables))))
   (if (and (>= commission (var-get minimum-commission)) (>= price (var-get minimum-listing-price)))
    (if (is-eq tradable-owner tx-sender)
     (if (map-insert on-sale {tradables: (contract-of tradables), tradable-id: tradable-id}
          {price: price, commission: commission, owner: tradable-owner})
      (begin
       (match (transfer-tradable-to-escrow tradables tradable-id)
        success (begin
            (ok true))
        error (begin (print error) (err err-transfer-failed))))
      (err err-duplicate-entry)
     )
     (err err-not-allowed)
    )
    (err err-commission-or-price-too-low)
   )
  )
 )
)

(define-public (unlist-asset (tradables <tradables-trait>) (tradable-id uint))
  (match (map-get? on-sale {tradables: (contract-of tradables), tradable-id: tradable-id})
    nft-data
    (if (is-eq (get owner nft-data) tx-sender)
        (match (transfer-tradable-from-escrow tradables tradable-id)
           success (begin
                     (map-delete on-sale {tradables: (contract-of tradables), tradable-id: tradable-id})
                     (ok true))
           error (begin (print error) (err err-transfer-failed)))
        (err err-not-allowed)
    )
    (err err-tradable-not-found)
  )
)

;; tx sender has to send the required amount
;; tx sender receives NFT
;; owner gets paid out the amount minus commission
;; stxnft address gets paid out commission
(define-public (purchase-asset (tradables <tradables-trait>) (tradable-id uint))
  (match (map-get? on-sale {tradables: (contract-of tradables), tradable-id: tradable-id})
    nft-data
    (let ((royal (map-get? royalties {tradables: (contract-of tradables)}))
          (price (get price nft-data))
          (commission-amount (/ (* price (get commission nft-data)) u10000))
          (royalty-amount (/ (* price (default-to u0 (get royalty-percent royal))) u10000))
          (royalty-address (get royalty-address royal))
          (to-owner-amount (- (- price commission-amount) royalty-amount)))
      ;; first send the amount to the owner
      (match (stx-transfer? to-owner-amount tx-sender (get owner nft-data))
        owner-success ;; sending money to owner succeeded
        (match (stx-transfer? commission-amount tx-sender contract-owner)
          commission-success ;; sending commission to contract owner succeeded
            (if (and (> royalty-amount u0) (is-some royalty-address))
              (match (stx-transfer? royalty-amount tx-sender (unwrap-panic royalty-address))
                royalty-success ;; sending royalty to artist succeeded
                (match (transfer-tradable-from-escrow tradables tradable-id)
                  transfer-success (begin
                    (map-delete on-sale {tradables: (contract-of tradables), tradable-id: tradable-id})
                    (ok true) ;; sending NFT to buyer succeeded
                  )
                  error (err err-transfer-failed)
                )
                error (err err-royalty-payment-failed)
              )
              (match (transfer-tradable-from-escrow tradables tradable-id)
                transfer-success (begin
                  (map-delete on-sale {tradables: (contract-of tradables), tradable-id: tradable-id})
                  (ok true) ;; sending NFT to buyer succeeded
                )
                error (err err-transfer-failed)
              )
           )
          error (err err-commission-payment-failed)
        )
        error (err err-payment-failed)
      )
    )
    (err err-tradable-not-found)
  )
)

(define-public (admin-unlist-asset (tradables <tradables-trait>) (tradable-id uint))
  (match (map-get? on-sale {tradables: (contract-of tradables), tradable-id: tradable-id})
    nft-data
    (if (is-eq contract-owner tx-sender)
        (match (return-tradable-from-escrow tradables tradable-id)
           success (begin
                     (map-delete on-sale {tradables: (contract-of tradables), tradable-id: tradable-id})
                     (ok true))
           error (begin (print error) (err err-transfer-failed)))
        (err err-not-allowed)
    )
    (err err-tradable-not-found)
  )
)

(define-public (set-minimum-commission (commission uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err err-not-allowed))
    (ok (var-set minimum-commission commission))
  )
)

;; TODO: if you don't need trait just use principal.
(define-public (set-royalty (contract <tradables-trait>) (address principal) (percent uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err err-not-allowed))
    (ok (map-set royalties {tradables: (contract-of contract)} {royalty-address: address, royalty-percent: percent}))
  )
)

(define-public (set-minimum-listing-price (price uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err err-not-allowed))
    (ok (var-set minimum-listing-price price))
  )
)

(define-public (set-listings-frozen (frozen bool))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err err-not-allowed))
    (ok (var-set listings-frozen frozen))
  )
)
