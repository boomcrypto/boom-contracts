(define-constant contract-creator tx-sender)
(define-private (pox-delegate-stack-stx (member {stacker: principal, amount-ustx: uint}) 
                  (context (tuple                     
                      (pox-address (tuple (hashbytes (buff 20)) (version (buff 1))))
                    (start-burn-ht uint)
                    (lock-period uint)
                    (result (list 750 (response (tuple (lock-amount uint) (stacker principal) (unlock-burn-height uint)) (tuple (kind (string-ascii 32)) (code uint))))))))
  (let ((pox-address (get pox-address context)) 
      (start-burn-ht (get start-burn-ht context))
      (lock-period (get lock-period context)))
    (let ((stack-result 
      (match (contract-call? 'ST000000000000000000002AMW42H.pox delegate-stack-stx
                  (get stacker member) (get amount-ustx member)
                  pox-address start-burn-ht lock-period)
        stacker-details (ok stacker-details)
        error (err {kind: "native-function-failed", code: (to-uint error)}))))
      {pox-address: pox-address,
        start-burn-ht: start-burn-ht,
        lock-period: lock-period,
        result: (unwrap-panic (as-max-len? (append (get result context) stack-result) u750))})))
    

(define-private (get-total (stack-result (response (tuple (lock-amount uint) (stacker principal) (unlock-burn-height uint)) (tuple (kind (string-ascii 32)) (code uint))))
    (total uint))
  (match stack-result
    details (+ total (get lock-amount details))
    error total))

(define-public (delegate-stack-stx-and-commit (members (list 750 (tuple (stacker principal) (amount-ustx uint))))                                     
                                    (pox-address (tuple (hashbytes (buff 20)) (version (buff 1))))
                                    (start-burn-ht uint)
                                    (lock-period uint)
                                    (reward-cycle uint))
  (let ((stack-result (get result (fold pox-delegate-stack-stx members {start-burn-ht: start-burn-ht, pox-address: pox-address, lock-period: lock-period, result: (list)}))))
    (let ((total (fold get-total stack-result u0)))
      (match (contract-call? 'ST000000000000000000002AMW42H.pox stack-aggregation-commit pox-address reward-cycle)
        success (ok {total: total, stack-result: stack-result})
        error (err {kind: "native-pox-failed", code: (to-uint error), stack-result: stack-result})))))
;;
;; payout
;;
(define-private (stx-transfer (details {stacker: principal, part-ustx: uint}))
  (stx-transfer? (get part-ustx details) tx-sender (get stacker details)))

(define-private (check-err (result (response bool uint)) (prior (response bool uint)))
  (match prior 
    ok-value result
    err-value  (err err-value)))

(define-private (calc-parts (member {stacker: principal, amount-ustx: uint}) 
            (context {payout-ustx: uint, stacked-ustx: uint, result: (list 750 {stacker: principal, part-ustx: uint})}))
  (let ((amount-ustx (get amount-ustx member)) (payout-ustx (get payout-ustx context)) (stacked-ustx (get stacked-ustx context)))          
    (let ((payout-details {stacker: (get stacker member), part-ustx: (/ (* amount-ustx payout-ustx) stacked-ustx)}))
      {payout-ustx: payout-ustx, stacked-ustx: stacked-ustx,
        result: (unwrap-panic (as-max-len? (append (get result context) payout-details) u750))})))


(define-public (payout (payout-ustx uint) (stacked-ustx uint) (members (list 750 (tuple (stacker principal) (amount-ustx uint)))))
  (let ((member-parts (get result (fold calc-parts members {payout-ustx: payout-ustx, stacked-ustx: stacked-ustx, result: (list)}))))
    (fold check-err
      (map stx-transfer member-parts) (ok true))))

;;
;; donate
;;
(define-public (donate (amount uint))
  (stx-transfer? amount tx-sender (as-contract tx-sender))
)

(define-public (empty-contract)
  (if (is-eq tx-sender contract-creator)
    (let ((contract-balance (stx-get-balance (as-contract tx-sender))))
        (if (> contract-balance u0)
          (as-contract (stx-transfer? contract-balance tx-sender contract-creator))
          (ok false)))
    (ok false)))