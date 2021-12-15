(define-read-only (name-resolve (namespace (buff 20)) (name (buff 48)))
  (if (is-eq name 0x1234)
    (ok {
        owner: tx-sender
      })
    (err 2013)
  )
)
