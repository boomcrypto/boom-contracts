;; @contract Boom NFTs
;; @version 3

;; testnet: ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM4DF2YCW.nft-trait.nft-trait
;; testnet: ST000000000000000000002AMW42H.bns
;; testnet: ST1QK1AZ24R132C0D84EEQ8Y2JDHARDR58SMAYMMW.commission-trait

(impl-trait 'ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM4DF2YCW.nft-trait.nft-trait)
(use-trait commission-trait .commission-trait.commission)

(define-non-fungible-token boom uint)
(define-data-var last-id uint u0)
(define-data-var last-series-id uint u0)

(define-constant PARTS_PER_MILLION 1000000)
(define-constant OWNER tx-sender)
;; scoped variable for boom-mint function
(define-data-var ctx-mint {series-id: uint, creator: principal} {series-id: u0, creator: tx-sender})


(define-map nft-categories uint 
  {id: uint, name: (string-utf8 256)})

(define-map meta uint
  {series-id: uint,
  number: uint,
  listed: bool,
  price: (optional uint),
  categories: (optional (list 5 uint)),
  fees: (optional principal)})

(define-map index-by-series-item
  {series-id: uint,
    number: uint}
  uint)

(define-map series-meta uint
  {creator: principal,
    count: uint,
    default-categories: (optional (list 5 uint)),
    uri: (string-ascii 256),
    hash: (optional (buff 64)),
    royalties: uint})

(define-map approvals {owner: principal, operator: principal, id: uint} bool)
(define-map approvals-all {owner: principal, operator: principal} bool)

;;
;; operable functions
;;
(define-private (is-approved-with-owner (id uint) (operator principal) (owner principal))
  (or
    (is-eq owner operator)
    (default-to (default-to
      false
        (map-get? approvals-all {owner: owner, operator: operator}))
          (map-get? approvals {owner: owner, operator: operator, id: id}))))

(define-read-only (is-approved (id uint) (operator principal))
  (let ((owner (unwrap! (nft-get-owner? boom id) err-no-nft)))
    (ok (is-approved-with-owner id operator owner))))

(define-public (set-approved (id uint) (operator principal) (approved bool))
	(ok (map-set approvals {owner: contract-caller, operator: operator, id: id} approved)))

(define-public (set-approved-all (operator principal) (approved bool))
	(ok (map-set approvals-all {owner: contract-caller, operator: operator} approved)))

(define-private (inc-last-series-id)
  (let ((series-id (+ u1 (var-get last-series-id))))
      (var-set last-series-id series-id)
      series-id))

(define-public (add-category (id uint) (name (string-utf8 256)))
  (begin
    (asserts! (or (is-eq OWNER tx-sender) (is-eq OWNER contract-caller)) err-permission-denied)
    (ok (map-set nft-categories id {id: id, name: name}))))

(define-private (mint-boom (number uint) (categories (optional (list 5 uint))))
  (let ((id (+ u1 (var-get last-id)))
        (ctx (var-get ctx-mint))
        (series-id (get series-id ctx))
        (series (unwrap-panic (map-get? series-meta series-id))))
      (unwrap-panic (nft-mint? boom id (get creator ctx)))
      (var-set last-id id)
      (map-insert meta id
          {series-id: series-id,
            number: number,
            listed: false,
            price: none,
            categories: categories,
            fees: none})
      (map-insert index-by-series-item {series-id: series-id, number: number} id)
      id))

;; @desc mints a list of NFTs belonging to the same NFT series
;; @param creator; the minter and owner to be of the NFTs
;; @param uri; identifier for series meta data
;; @param hash; optional hash of content for series
;; @param size; supply of NFTs of series
;; @post boom; will be minted for new owner
(define-public (mint-series (creator principal)
  (uri (string-ascii 256)) (hash (optional (buff 64))) (ids (list 300 uint)) (royalties uint) (categories (optional (list 5 uint))))
  (let ((series-id (inc-last-series-id))
    (size (len ids)))
    ;; set scoped variable for mint-boom call
    (var-set ctx-mint {series-id: series-id, creator: creator})
    (map-insert series-meta series-id
      {creator: creator,
      count: size,
      uri: uri,
      hash: hash,
      default-categories: categories,
      royalties: royalties})
    (ok {series-id: series-id, ids: (map mint-boom ids (list categories))})))

;; change categories of some nft.
;; The new categories override the old ones.
(define-public (change-categories (id uint) (owner principal) (categories (optional (list 5 uint))))
    (let 
      ((nft (merge (unwrap! (map-get? meta id) err-no-nft) {categories: categories})))
      (print nft)
      (asserts! (is-approved-with-owner id contract-caller owner) err-permission-denied)
      (map-set meta id nft)
      (ok true)))


(define-public (transfer (id uint) (sender principal) (recipient principal))
  (let ((owner (unwrap! (nft-get-owner? boom id) err-no-nft)))
    ;; rule 0: is operable?
    (asserts! (is-approved-with-owner id contract-caller owner) err-permission-denied)
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
    (print (merge listing {action: "list-in-ustx", id: id}))
    (ok true)))

(define-public (unlist-in-ustx (id uint))
  (let ((nft (unwrap! (map-get? meta id) err-no-nft))
      (owner (unwrap! (nft-get-owner? boom id) err-no-nft))
      (listing (merge nft {price: none, listed: false, fees: none})))
    ;; rule: only owner can unlist
    (asserts! (or (is-eq owner tx-sender) (is-eq owner contract-caller)) err-permission-denied)
    (map-set meta id listing)
    (print {action: "unlist-in-ustx", id: id})
    (ok true)))

(define-public (buy-in-ustx (id uint) (fees <commission-trait>))
  (let ((nft (unwrap! (map-get? meta id) err-no-nft))
    (owner (unwrap! (nft-get-owner? boom id) err-no-owner))
    (price (unwrap! (get price nft) err-listing))
    (nft-fees (unwrap! (get fees nft) err-no-fees))
    (metadata (unwrap! (map-get? series-meta (get series-id nft)) err-no-nft))
    (royalties ( / (* price u1000000) (get royalties metadata))))
    ;; rule 1: nft must be listed
    (asserts! (get listed nft) err-listing)
    ;; rule 2: same fee contract used
    (asserts! (is-eq (contract-of fees) nft-fees) err-wrong-fees)
    (map-set meta id (merge nft {price: none, listed: false, fees: none}))
    (print {id: id, price: none, listed: false})
    ;; royalties are paid
    (try! (stx-transfer? royalties tx-sender (get creator metadata)))
    ;; price in STX is sent to owner
    (try! (stx-transfer? (- price royalties) tx-sender owner))
    ;; marketplace fees are paid
    (try! (contract-call? fees pay id price))
    ;; buyer of listed nft can transfer from owner
    (try! (nft-transfer? boom id owner tx-sender))
    (print {action: "buy-in-ustx", id: id, price: price, royalties: royalties})
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
