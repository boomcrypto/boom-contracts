;; This contract is used to distribute STX to the artists/owner of a Boombox NFT
;; This distribution trait allocates 100% of the STX to the Boombox creator

(define-constant artist 'SP000000000000000000002Q6VF78)

(define-public (distribute (nft-id uint) (amount uint) (stacks-tip uint))
    (begin 
        (try! (stx-transfer? amount tx-sender artist))
        (ok amount)))

(define-private (stx-transfer-map (nft-id uint) (amount uint))
  (distribute nft-id amount u0))

(define-public (distribute-many (nft-ids (list 200 uint)) (amounts (list 200 uint)) (stacks-tip uint))
    (if true (ok (map stx-transfer-map nft-ids amounts)) (err u1))) 
