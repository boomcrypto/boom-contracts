
;; prepaid-stx
;; iou stacks

;; constants
(define-fungible-token iou-stx)

(define-constant err-not-authorized (err u403))

;; data maps and vars
;; map owner/operator/tokenId: approved
(define-map approvals {owner: principal, operator: principal} uint)
(define-map approvals-all {owner: principal, operator: principal} bool)


;; private functions
;;

;; public functions
;;

(define-public (transfer (amount-ustx uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-approved-with-owner amount-ustx contract-caller sender) err-not-authorized)
    (ft-transfer? iou-stx amount-ustx sender recipient)))

(define-public (transfer-memo (amount-ustx uint) (sender principal) (recipient principal) (memo (buff 32)))
  (begin
    (try! (transfer amount-ustx sender recipient))
    (print memo)
    (ok true)))

;;
;; operable functions
;;
(define-private (is-approved-with-owner (amount uint) (operator principal) (owner principal))
  (or
    (is-eq owner operator)
    (match (map-get? approvals {owner: owner, operator: operator})
      approved-amount (if (<= amount approved-amount)
        (map-set approvals {owner: owner, operator: operator}
          (- approved-amount amount))
        false)
      (default-to false
        (map-get? approvals-all {owner: owner, operator: operator})))))

(define-public (is-approved (amount uint) (operator principal))
  (ok (is-approved-with-owner amount operator contract-caller)))

(define-public (set-approved (amount uint) (operator principal) (approved bool))
	(ok (map-set approvals {owner: contract-caller, operator: operator}
        (if approved amount u0))))

(define-public (set-approved-all (operator principal) (approved bool))
	(ok (map-set approvals-all {owner: contract-caller, operator: operator} approved)))

;; read-only functions

;; get the token balance of owner
(define-read-only (get-balance (owner principal))
  (ok (ft-get-balance iou-stx owner)))

;; returns the total number of tokens
(define-read-only (get-total-supply)
  (ok (ft-get-supply iou-stx)))

;; returns the token name
(define-read-only (get-name)
  (ok "Prepaid STX"))

;; the symbol or "ticker" for this token
(define-read-only (get-symbol)
  (ok "iou-stx"))

;; the number of decimals used
(define-read-only (get-decimals)
  (ok u0))

(define-public (get-token-uri)
  (ok (some u"ipfs://Qm")))
