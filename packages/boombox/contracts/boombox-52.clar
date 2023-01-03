;; Boombox 50
;; b-52

(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)
(impl-trait .boombox-trait.boombox-trait)

(define-non-fungible-token b-52 uint)

;; Constants
(define-constant DEPLOYER tx-sender)

;; Error Codes
(define-constant ERR-NOT-AUTHORIZED u101)
(define-constant ERR-INVALID-USER u102)
(define-constant ERR-LISTING u103)
(define-constant ERR-WRONG-COMMISSION u104)
(define-constant ERR-NOT-FOUND u105)
(define-constant ERR-NFT-MINT u106)
(define-constant ERR-CONTRACT-LOCKED u107)
(define-constant ERR-INVALID-STACKS-TIP (err u108))

;; Variables
(define-data-var last-id uint u0)
(define-data-var artist-address principal 'SP21CYC2GKWTVK3FHFF4VVJNKVNQDMRY5GQS27XQB)
(define-data-var commission-address principal 'SP3QC4R6M7M0DAZBXSZCW4FWGDCNDD05FV8Y0AY8C)
(define-data-var boombox-admin principal 'SP1QK1AZ24R132C0D84EEQ8Y2JDHARDR58R72E1ZW.boombox-admin-v3)


;; Maps
(define-map boombox-id principal uint);; boombox-admin contract : boombox id
(define-map token-count principal uint)
(define-map market uint {price: uint, commission: principal})


;; Public helper functions
(define-public (set-commision-address (address principal))
  (begin
    (asserts! (or (is-eq tx-sender (var-get artist-address)) (is-eq tx-sender DEPLOYER)) (err ERR-INVALID-USER))
    (ok (var-set commision-address address))))

(define-public (burn (token-id uint))
  (begin 
    (asserts! (is-owner token-id tx-sender) (err ERR-NOT-AUTHORIZED))
    (nft-burn? b-52 token-id tx-sender)))

;; adds the ability to set a custom event message
(define-public (transfer-memo (id uint) (sender principal) (recipient principal) (memo (buff 34)))
  (begin
    (try! (transfer id sender recipient))
    (print memo)
    (ok true)))

(define-public (set-boombox-admin (admin principal))
  (begin
    (asserts! (or (is-eq tx-sender (var-get artist-address)) (is-eq tx-sender DEPLOYER)) (err ERR-NOT-AUTHORIZED))
    (var-set boombox-admin admin)
    (ok true)))

;; 'mint' can only be called by boombox admin for boomboxes
(define-public (mint (bb-id uint) (stacker principal) (amount-ustx uint) (pox-addr {version: (buff 1), hashbytes: (buff 20)}) (locking-period uint))
  (let ((next-id (+ u1 (var-get last-id))))
    (asserts! (is-eq bb-id (unwrap! (map-get? boombox-id contract-caller) ERR-NOT-AUTHORIZED)) ERR-NOT-AUTHORIZED)
    (var-set last-id next-id)
    (try! (nft-mint? b-52 next-id stacker))
    (ok next-id)))

;; SIP-009 functions

(define-read-only (get-last-token-id)
  (ok (var-get last-id)))

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-none (map-get? market token-id)) ERR-LISTING)
    (asserts! (is-eq tx-sender sender) (err ERR-INVALID-USER))
    (nft-transfer? b-52 token-id sender recipient)))

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? b-52 token-id)))

(define-read-only (get-token-uri (id uint))
  (ok (some "ipfs://bafkreideogan5eeypcnxwtlxi4llz74r77mdsbf6xkqdmupnhqpcpu5nrm")))

;; Private helper functions
(define-private (is-owner (token-id uint) (user principal))
    (is-eq user (unwrap! (nft-get-owner? b-52 token-id) false)))

;; Read-only functions
(define-read-only (get-owner-at-block (token-id uint) (stacks-tip uint))
  (match (get-block-info? id-header-hash stacks-tip)
    block (ok (at-block block (nft-get-owner? b-52 token-id)))
    ERR-INVALID-STACKS-TIP))


;; non-custodian marketplace functions
;; using megapont commission trait
;; until a conical trait is established
(use-trait commission-trait 'SP3D6PV2ACBPEKYJTCMH7HEN02KP87QSP8KTEH335.commission-trait.commission)

(define-read-only (get-balance (account principal))
  (default-to u0
    (map-get? token-count account)))

(define-private (trnsfr (id uint) (sender principal) (recipient principal))
  (match (nft-transfer? b-52 id sender recipient)
    success
      (let
        ((sender-balance (get-balance sender))
        (recipient-balance (get-balance recipient)))
          (map-set token-count
            sender
            (- sender-balance u1))
          (map-set token-count
            recipient
            (+ recipient-balance u1))
          (ok success))
    error (err error)))

(define-private (is-sender-owner (id uint))
  (let ((owner (unwrap! (nft-get-owner? b-52 id) false)))
    (or (is-eq tx-sender owner) (is-eq contract-caller owner))))

(define-read-only (get-listing-in-ustx (id uint))
  (map-get? market id))

(define-public (list-in-ustx (id uint) (price uint) (comm-trait <commission-trait>))
  (let ((listing  {price: price, commission: (contract-of comm-trait)}))
    (asserts! (is-sender-owner id) (err ERR-NOT-AUTHORIZED))
    (map-set market id listing)
    (print {  notification: "nft-listing", 
              payload: (merge listing {
                id: id, 
                action: "list-in-ustx" })})
    (ok true)))

(define-public (unlist-in-ustx (id uint))
  (begin
    (asserts! (is-sender-owner id) (err ERR-NOT-AUTHORIZED))
    (map-delete market id)
    (print {  notification: "nft-listing", 
              payload:{
                id: id, 
                action: "unlist-in-ustx" }})
    (ok true)))

(define-public (buy-in-ustx (id uint) (comm-trait <commission-trait>))
  (let ((owner (unwrap! (nft-get-owner? b-52 id) (err ERR-NOT-FOUND)))
      (listing (unwrap! (map-get? market id) (err ERR-LISTING)))
      (price (get price listing)))
    (asserts! (is-eq (contract-of comm-trait) (get commission listing)) (err ERR-WRONG-COMMISSION))
    (try! (stx-transfer? price tx-sender owner))
    (try! (pay-royalty price))
    (try! (contract-call? comm-trait pay id price))
    (try! (trnsfr id owner tx-sender))
    (map-delete market id)
    (print {  notification: "nft-listing", 
              payload:{
                id: id, 
                action: "buy-in-ustx" }})    
    (ok true)))
    
(define-data-var royalty-percent uint u250)

(define-read-only (get-royalty-percent)
  (ok (var-get royalty-percent)))

(define-private (pay-royalty (price uint))
  (let (
    (royalty (/ (* price (var-get royalty-percent)) u10000))
  )
  (if (> (var-get royalty-percent) u0)
    (try! (stx-transfer? royalty tx-sender (var-get artist-address)))
    (print false)
  )
  (ok true)))

;; can only be called by boombox admin
(define-public (set-boombox-id (bb-id uint))
  (begin
    (asserts! (is-eq contract-caller (var-get boombox-admin)) ERR-NOT-AUTHORIZED)
    (map-set boombox-id contract-caller bb-id)
    (ok true)))
