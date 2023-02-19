(define-public (airdrop)
(begin
(try! (contract-call? .moons-airdrop set-mint (as-contract tx-sender)))
(try! (contract-call? .moons-airdrop mint 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5 u1))
(try! (contract-call? .moons-airdrop mint 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5 u2))
(ok true)
))