
;; mock-tradable-trait
;; <add a description here>

(impl-trait .tradables-trait.tradables-trait)

;; data maps and vars
(define-map registery uint principal)

;; public functions
(define-public (mint (id uint) (address principal))
    (ok (map-set registery id address)))


(define-read-only (get-owner (id uint))
  (ok (map-get? registery id)))

(define-public (transfer (id uint) (from principal) (to principal)) 
    (ok (map-set registery id to)))
