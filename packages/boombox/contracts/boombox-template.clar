;; TODO: change the name (comment immediatly below todos)
;; TODO: change all instances of b-xx to nft name (b-30, foobar, etc)
;; TODO: change get-token-uri function response

;; Boombox 30

(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)
(impl-trait .boombox-trait.boombox-trait)

(define-non-fungible-token b-xx uint)

;; constants
;;
(define-constant deployer tx-sender)
(define-constant creator 'SP1PGB1T5KRNWZGDS1JEV7775HJMYBSEM2Z333Y8Y)

;; data maps and vars
;;
(define-data-var last-id uint u0)
(define-data-var boombox-admin principal .boombox-admin-v3)
;; boombox-admin contract : boombox id
(define-map boombox-id principal uint)
;; approval maps
(define-map approvals {owner: principal, operator: principal, id: uint} bool)
(define-map approvals-all {owner: principal, operator: principal} bool)

;; private functions
(define-private (is-approved-with-owner (id uint) (operator principal) (owner principal))
  (or
    (is-eq owner operator)
    (default-to (default-to
      false
        (map-get? approvals-all {owner: owner, operator: operator}))
          (map-get? approvals {owner: owner, operator: operator, id: id}))))

;; public functions
;;

;; operable functions
(define-read-only (is-approved (id uint) (operator principal))
  (let ((owner (unwrap! (nft-get-owner? b-xx id) err-not-found)))
    (ok (is-approved-with-owner id operator owner))))

(define-public (set-approved (id uint) (operator principal) (approved bool))
	(ok (map-set approvals {owner: contract-caller, operator: operator, id: id} approved)))

(define-public (set-approved-all (operator principal) (approved bool))
	(ok (map-set approvals-all {owner: contract-caller, operator: operator} approved)))

;; transfer functions
(define-public (transfer (id uint) (sender principal) (recipient principal))
  (let ((owner (unwrap! (nft-get-owner? b-xx id) err-not-found)))
    (asserts! (is-approved-with-owner id contract-caller owner) err-not-authorized)
    (nft-transfer? b-xx id sender recipient)))

(define-public (transfer-memo (id uint) (sender principal) (recipient principal) (memo (buff 34)))
  (begin
    (try! (transfer id sender recipient))
    (print memo)
    (ok true)))

(define-read-only (get-owner (id uint))
  (ok (nft-get-owner? b-xx id)))

(define-read-only (get-owner-at-block (id uint) (stacks-tip uint))
  (match (get-block-info? id-header-hash stacks-tip)
    ihh (ok (at-block ihh (nft-get-owner? b-xx id)))
    err-invalid-stacks-tip))

(define-read-only (get-last-token-id)
  (ok (var-get last-id)))

(define-read-only (get-token-uri (id uint))
  (ok (some "https://tbd")))

;; can only be called by boombox admin
(define-public (mint (bb-id uint) (stacker principal) (amount-ustx uint) (pox-addr {version: (buff 1), hashbytes: (buff 20)}) (locking-period uint))
  (let ((next-id (+ u1 (var-get last-id))))
    (asserts! (is-eq bb-id (unwrap! (map-get? boombox-id contract-caller) err-not-authorized)) err-not-authorized)
    (var-set last-id next-id)
    (try! (nft-mint? b-xx next-id stacker))
    (ok next-id)))

;; can only be called by boombox admin
(define-public (set-boombox-id (bb-id uint))
  (begin
    (asserts! (is-eq contract-caller (var-get boombox-admin)) err-not-authorized)
    (map-set boombox-id contract-caller bb-id)
    (ok true)))

;; can only be called by deployer
(define-public (set-boombox-admin (admin principal))
  (begin
    (asserts! (is-eq contract-caller deployer) err-not-authorized)
    (var-set boombox-admin admin)
    (ok true)))

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

;; errors
(define-constant err-not-creator (err u400))
(define-constant err-permission-denied (err u403))
(define-constant err-no-nft (err u404))
(define-constant err-listing (err u405))
(define-constant err-no-owner (err u406))
(define-constant err-royalties (err u500))
(define-constant err-no-fees (err u501))
(define-constant err-wrong-fees (err u502))
(define-constant err-not-authorized (err u403))
(define-constant err-not-found (err u404))
(define-constant err-invalid-stacks-tip (err u608))