;; @contract Boom NFTs
;; @version 3

;; testnet: ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM4DF2YCW.nft-trait.nft-trait
;; testnet: ST000000000000000000002AMW42H.bns
;; testnet: ST1QK1AZ24R132C0D84EEQ8Y2JDHARDR58SMAYMMW.commission-trait

(impl-trait 'ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM4DF2YCW.nft-trait.nft-trait)
(use-trait commission-trait .commission.commission)

(define-non-fungible-token boom uint)
(define-data-var last-id uint u0)
(define-data-var last-series-id uint u0)

;; scoped variable for boom-mint function
(define-data-var ctx-mint {series-id: uint, creator: principal} {series-id: u0, creator: tx-sender})

(define-map meta uint
  {series-id: uint,
  number: uint,
  listed: bool,
  price: (optional uint),
  fees: (optional principal)})

(define-map index-by-series-item
  {series-id: uint,
    number: uint}
  uint)

(define-map series-meta uint
  {creator: principal,
    creator-name: (optional {namespace: (buff 20), name: (buff 48)}),
    name: (string-utf8 80),
    count: uint,
    uri: (string-ascii 256),
    hash: (optional (buff 64)),
    royalties: principal})

(define-private (owns-name (user principal) (username (tuple (namespace (buff 20)) (name (buff 48)))))
  (match (contract-call? 'ST000000000000000000002AMW42H.bns name-resolve (get namespace username) (get name username))
    details (is-eq user (get owner details))
    error false))

(define-private (inc-last-series-id)
  (let ((series-id (+ u1 (var-get last-series-id))))
      (var-set last-series-id series-id)
      series-id))

(define-private (is-creator (creator principal)
  (creator-name (optional (tuple (namespace (buff 20)) (name (buff 48))))))
  (and
    (or (is-eq creator tx-sender) (is-eq creator contract-caller))
    (match creator-name
      username (owns-name creator username)
      true )))

(define-private (mint-boom (number uint))
  (let ((id (+ u1 (var-get last-id)))
        (ctx (var-get ctx-mint))
        (series-id (get series-id ctx)))
      (unwrap-panic (nft-mint? boom id (get creator ctx)))
      (var-set last-id id)
      (map-insert meta id
          {series-id: series-id,
            number: number,
            listed: false,
            price: none,
            fees: none})
      (map-insert index-by-series-item {series-id: series-id, number: number} id)
      id))

;; @desc mints a list of NFTs belonging to the same NFT series
;; @param creator; the minter and owner to be of the NFTs
;; @param creator-name; optional BNS name belonging to creator
;; @param name; short name of series
;; @param uri; identifier for series meta data
;; @param hash; optional hash of content for series
;; @param size; supply of NFTs of series
;; @post boom; will be minted for new owner
(define-public (mint-series (creator principal) (creator-name (optional {namespace: (buff 20), name: (buff 48)}))
  (name (string-utf8 80)) (uri (string-ascii 256)) (hash (optional (buff 64))) (ids (list 300 uint)) (royalties <commission-trait>))
  (let ((series-id (inc-last-series-id))
    (size (len ids)))
    (asserts! (is-creator creator creator-name) err-not-creator)
    ;; set scoped variable for mint-boom call
    (var-set ctx-mint {series-id: series-id, creator: creator})
    (map-insert series-meta series-id
      {creator: creator,
      creator-name: creator-name,
      name: name,
      count: size,
      uri: uri,
      hash: hash,
      royalties: (contract-of royalties)})
    (ok {series-id: series-id, ids: (map mint-boom ids)})))

(define-public (transfer (id uint) (sender principal) (recipient principal))
  (begin
    ;; rule 1: only unlisted nfts can be transferred
    (asserts! (not (get listed (unwrap! (map-get? meta id) err-no-nft))) err-listing)
    ;; rule 2: current owner can transfer
    (asserts! (or (is-eq sender tx-sender) (is-eq sender contract-caller)) err-permission-denied)
    (nft-transfer? boom id sender recipient)))

(define-public (burn (id uint))
  (let ((owner (unwrap! (nft-get-owner? boom id) err-no-nft)))
    ;; rule 1: only unlisted nfts can be burnt
    (asserts! (not (get listed (unwrap! (map-get? meta id) err-no-nft))) err-listing)
    ;; rule 2: only current owner can burn
    (asserts! (or (is-eq owner tx-sender) (is-eq owner contract-caller)) err-permission-denied)
    (nft-burn? boom id owner)))


(define-public (list-in-ustx (id uint) (price uint) (fees <commission-trait>))
  (let ((nft (unwrap! (map-get? meta id) err-no-nft))
      (owner (unwrap! (nft-get-owner? boom id) err-no-nft))
      (listing (merge nft {price: (some price), listed: true, fees: (some (contract-of fees))})))
    ;; rule: only owner can list
    (asserts! (or (is-eq owner tx-sender) (is-eq owner contract-caller)) err-permission-denied)
    (map-set meta id listing)
    (print (merge listing {a: "list-in-ustx", id: id}))
    (ok true)))

(define-public (unlist-in-ustx (id uint))
  (let ((nft (unwrap! (map-get? meta id) err-no-nft))
      (owner (unwrap! (nft-get-owner? boom id) err-no-nft))
      (listing (merge nft {price: none, listed: false, fees: none})))
    ;; rule: only owner can unlist
    (asserts! (or (is-eq owner tx-sender) (is-eq owner contract-caller)) err-permission-denied)
    (map-set meta id listing)
    (print {a: "unlist-in-ustx", id: id})
    (ok true)))

(define-public (buy-in-ustx (id uint) (royalties <commission-trait>) (fees <commission-trait>))
  (let ((nft (unwrap! (map-get? meta id) err-no-nft))
    (owner (unwrap! (nft-get-owner? boom id) err-no-owner))
    (price (unwrap! (get price nft) err-listing))
    (metadata (unwrap! (map-get? series-meta (get series-id nft)) err-no-nft))
    (nft-fees (unwrap! (get fees nft) err-no-fees)))
    ;; rule 1: nft must be listed
    (asserts! (get listed nft) err-listing)
    ;; rule 2: same royalties contract used
    (asserts! (is-eq (contract-of royalties) (get royalties metadata)) err-royalties)
    (asserts! (is-eq (contract-of fees) nft-fees) err-wrong-fees)
    (map-set meta id (merge nft {price: none, listed: false, fees: none}))
    (print {id: id, price: none, listed: false})
    ;; price in STX is sent to owner
    (try! (stx-transfer? price tx-sender owner))
    ;; royalties are paid
    (try! (contract-call? fees pay id price))
    ;; royalties are paid
    (try! (contract-call? royalties pay id price))
    ;; buyer of listed nft can transfer from owner
    (try! (nft-transfer? boom id owner tx-sender))
    (print {a: "buy-in-ustx", id: id})
    (ok true)))

(define-read-only (get-owner (id uint))
  (ok (nft-get-owner? boom id)))

(define-read-only (get-contract-meta)
  {uri: "https://boom.money/images/boom10.png", name: "Boom Collectible"})

(define-read-only (get-series-meta (series-id uint))
    (map-get? series-meta series-id))

(define-read-only (get-meta (id uint))
  (map-get? meta id))

(define-read-only (get-meta-by-serial
    (series-id uint)
    (number uint))
    (match (map-get? index-by-series-item {series-id: series-id, number: number})
      id
        (map-get? meta id)
      none))

(define-read-only (get-token-uri (nft-id uint))
  (let ((nft-series-id (get series-id (unwrap! (map-get? meta nft-id) (ok none))))
        (series-meta-data (map-get? series-meta nft-series-id)))
    (ok (get uri series-meta-data))))

(define-read-only  (get-last-token-id)
  (ok (var-get last-id)))

(define-read-only (get-last-series-id)
  (var-get last-series-id))

;; errors
(define-constant err-not-creator (err u400))
(define-constant err-permission-denied (err u403))
(define-constant err-no-nft (err u404))
(define-constant err-listing (err u405))
(define-constant err-no-owner (err u406))
(define-constant err-royalties (err u500))
(define-constant err-no-fees (err u501))
(define-constant err-wrong-fees (err u502))
