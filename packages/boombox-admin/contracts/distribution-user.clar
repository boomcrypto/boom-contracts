;; This contract is used to distribute STX to the artists/owner of a Boombox NFT
;; This distribution trait allocates 100% of the STX to the Boombox owner
;; change "boomboxes-cycle-56-v2" to the name of your contract


(define-constant err-not-found (err u404))

(define-public (distribute (nft-id uint) (amount uint) (stacks-tip uint))
    (let ((owner (unwrap! (unwrap! (contract-call? .boomboxes-cycle-56-v2 get-owner-at-block nft-id stacks-tip) err-not-found) err-not-found)))
        (try! (stx-transfer? amount tx-sender owner))
        (ok amount)))

(define-data-var ctx-stacks-tip uint u0)

(define-private (stx-transfer-map (nft-id uint) (amount uint))
  (distribute nft-id amount (var-get ctx-stacks-tip)))

(define-public (distribute-many (nft-ids (list 200 uint)) (amounts (list 200 uint)) (stacks-tip uint))
    (begin 
      (var-set ctx-stacks-tip stacks-tip)
      (if true (ok (map stx-transfer-map nft-ids amounts)) (err u1))))