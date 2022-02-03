(use-trait bb-trait .boombox-trait.boombox-trait)

(define-constant min-balance u120000000000)
(define-constant boombox-contract .indefinite-boombox-3)
(define-constant boombox-id u5)
(define-constant beneficary 'SP4NK85F5Y3KJESRF6S4VXBSTAPE7006V5P7ZNHT)

(define-public (lend (amount uint))
    (begin
        (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
        (try! (mint-iou amount tx-sender))
        (ok true)))

(define-public (repay (amount uint) (user principal))
    (begin        
        (try! (as-contract (stx-transfer? amount tx-sender user)))
        (burn-iou amount user)
        (ok true)))

(define-public (repay-many (list details {amount: uint, user: principal}))
    (ok true))

(define-public (delegate-stx (fq-contract <bb-trait>))
    (let ((balance (stx-get-balance (as-contract tx-sender))))
        (asserts! (> balance min-balance) err-low-balance)     
        (asserts! (is-eq (contract-of fq-contract) boombox-contract) err-invalid-boombox)   
        (try! (as-contract (contract-call? .pox allow-contract-caller .boombox-admin none)))
        (try! (as-contract (contract-call? .boombox-admin delegate-stx )
                boombox-id fq-contract balance)))
        (as-contract (revoke-delegation))
        (as-contract (set-payout-hint beneficary))
        (ok true))

