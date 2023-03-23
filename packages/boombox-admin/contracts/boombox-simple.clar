(define-data-var last-nft-id uint u0)

(define-public (mint (bb-id uint) (stacker principal) (amount-ustx uint) (pox-addr {version: (buff 1), hashbytes: (buff 32)}) (locking-period uint))
  (let ((nft-id (+ u1 (var-get last-nft-id))))
    (var-set last-nft-id nft-id)
    (print {bb-id: bb-id, stacker: stacker, amount-ustx: amount-ustx, pox-addr: pox-addr, locking-period: locking-period})
    (ok nft-id)))

(define-read-only (get-owner (id uint))
  (ok (some 'SP000000000000000000002Q6VF78)))

(define-read-only (get-owner-at-block (id uint) (stacks-tip uint))
  (match (get-block-info? id-header-hash stacks-tip)
    ihh (ok (at-block ihh (some 'SP000000000000000000002Q6VF78)))
    err-invalid-stacks-tip))

(define-public (set-boombox-id (bb-id uint))
  (ok true))

(define-constant err-invalid-stacks-tip (err u608))

(define-constant artist 'SP000000000000000000002Q6VF78)

(define-public (distribute (nft-id uint) (amount uint) (stacks-tip uint))
    (begin 
        (try! (stx-transfer? amount tx-sender artist))
        (ok amount)))

(define-private (stx-transfer-map (nft-id uint) (amount uint))
  (distribute nft-id amount u0))

(define-public (distribute-many (nft-ids (list 200 uint)) (amounts (list 200 uint)) (stacks-tip uint))
    (if true (ok (map stx-transfer-map nft-ids amounts)) (err u1))) 
