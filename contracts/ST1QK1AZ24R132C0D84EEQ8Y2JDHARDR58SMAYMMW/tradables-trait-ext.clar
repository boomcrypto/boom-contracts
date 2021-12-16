;; based on https://github.com/friedger/clarity-marketplace/blob/master/contracts/tradables-trait-ext.clar
;; 

;; This trait is NOT a subset of the functions of sip-009 trait for NFTs.
(define-trait tradables-trait
  (
     ;; Owner of a given token identifier
    (get-owner (uint) (response (optional principal) uint))
    ;; Transfer from the sender to a new principal
    (transfer (uint principal principal) (response bool {kind: (string-ascii 32), code: uint}))
  )
)