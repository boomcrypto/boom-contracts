;; finalize boombox 100 blocks before end of every stacking cycle
(impl-trait 'SP3C0TCQS0C0YY8E0V3EJ7V4X9571885D44M8EFWF.arkadiko-automation-trait-v1.automation-trait)

(define-constant pox-addr {version: 0x01, hashbytes: 0x13effebe0ea4bb45e35694f5a15bb5b96e851afb})
(define-map commits uint uint)

(define-public (initialize)
  (ok true)
)

(define-read-only (check-job)
  (let ((reward-cycle (contract-call? 'SP000000000000000000002Q6VF78.pox-2 current-pox-reward-cycle))
        (start-of-cycle (contract-call? 'SP000000000000000000002Q6VF78.pox-2 reward-cycle-to-burn-height reward-cycle)))
    (asserts! (> burn-block-height (+ u2000 start-of-cycle)) (ok false))
    (asserts! (is-none (map-get? commits (+ u1 reward-cycle))) (ok false))
    (ok true)))

(define-public (run-job)
  (let ((next-cycle (+ u1 (contract-call? 'SP000000000000000000002Q6VF78.pox-2 current-pox-reward-cycle))))
    (asserts! (unwrap-panic (check-job)) (ok false))
    (map-insert commits next-cycle block-height)
    (contract-call? .boombox-admin stack-aggregation-commit pox-addr next-cycle)))

(define-read-only (get-commit (reward-cycle uint))
    (map-get? commits reward-cycle))