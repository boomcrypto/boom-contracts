(use-trait bb-trait .boombox-trait.boombox-trait)

(define-constant min-balance u120000000000)
(define-constant boombox-contract .indefinite-boombox-3)
(define-constant boombox-id u5)
(define-constant beneficary 'SP4NK85F5Y3KJESRF6S4VXBSTAPE7006V5P7ZNHT)

(define-constant err-low-balance (err u402))
(define-constant err-invalid-boombox (err u600))

(define-public (lend (amount uint))
    (begin
        (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
        (try! (contract-call? .iou-stx mint amount tx-sender))
        (ok true)))


(define-public (repay (amount uint) (user principal))
    (begin        
        (try! (as-contract (stx-transfer? amount tx-sender user)))
        (try! (contract-call? .iou-stx burn amount user))
        (ok true)))

(define-public (repay-many (details (list 200 {amount: uint, user: principal})))
    (ok true))

(define-public (delegate-stx (fq-contract <bb-trait>))
    (let ((balance (stx-get-balance (as-contract tx-sender))))
        (asserts! (> balance min-balance) err-low-balance)     
        (asserts! (is-eq (contract-of fq-contract) boombox-contract) err-invalid-boombox)   
        (try! (err-to-uint (as-contract (contract-call? 'ST000000000000000000002AMW42H.pox allow-contract-caller .boombox-admin none))))
        (try! (as-contract (contract-call? .boombox-admin delegate-stx 
                boombox-id fq-contract balance)))
        (try! (err-to-uint (as-contract (contract-call? 'ST000000000000000000002AMW42H.pox revoke-delegate-stx))))
        (unwrap-panic (as-contract (contract-call? .friedger-pool-payout-hints set-payout-recipient beneficary)))
        (ok true)))

(define-private (err-to-uint (resp (response bool int)))
    (match resp
        success (ok success)
        error (err (to-uint error))))