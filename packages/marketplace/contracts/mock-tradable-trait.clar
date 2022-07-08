
;; mock-tradable-trait
;; <add a description here>

(impl-trait .tradables-trait.tradables-trait)

;; data maps and vars
(define-map registery uint principal)
(define-data-var failing bool false)

(define-constant err-transfer-failed u666)
(define-constant err-tradable-not-found u5)

;; public functions
(define-public (mint (id uint) (address principal))
    (ok (map-set registery id address)))


(define-read-only (get-owner (id uint))
  (ok (map-get? registery id)))

(define-public (transfer (id uint) (from principal) (to principal))
  (if (var-get failing)
    (err err-transfer-failed)
    (match (map-get? registery id) 
      owner 
      (ok (map-set registery id to))
      (err err-tradable-not-found)
    ))
)

(define-public (set-failing (fail bool))
  (ok (var-set failing fail))
)
