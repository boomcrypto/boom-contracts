
;; booster
;; set payouts to be distributed to other addresses

;; constants
;;
(define-constant err-invalid-recipients (err u500))

;; data maps and vars
;;

;; private functions
;;
(define-private (add-percentage (rewards {recipient: principal, percentage: uint}) (sum uint))
    (+ sum (get percentage rewards)))

;; public functions
;;
;; mapping between stacker and recipient of stacker's rewards
;; (define-map payout-map principal (list 10 {recipient: principal, percentage: uint}))
(define-map payout-map principal 
  (list 10 {
    recipient: (optional principal), 
    recipient-burnchain: (optional {version: (buff 1), hashbytes: (buff 32)}), 
    percentage: uint }))

(define-read-only (get-payout-recipients (stacker principal))
    (map-get? payout-map stacker))
    
;; set receiver of the stacker's rewards
(define-public (set-payout-recipients (rewards-distribution (list 10 {recipient: principal, percentage: uint})))
    (begin 
        (asserts! (<= (fold add-percentage rewards-distribution u0) u100) err-invalid-recipients)
        (ok (map-set payout-map tx-sender rewards-distribution))))

;; remove receiver of the stacker's rewards. Rewards will be sent to stacker
(define-public (delete-payout-recipient (recipient principal))
    (ok (map-delete payout-map tx-sender)))

