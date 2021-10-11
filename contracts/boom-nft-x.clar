(define-non-fungible-token boom uint)
(define-data-var last-id uint u0)
(define-data-var last-series-id uint u0)

(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; each nft id to series id
(define-map meta uint {series-id: uint, number: uint})


(define-map index-by-series-item
  (tuple
    (series-id uint)
    (number uint))
  uint)

(define-map series-meta uint
  {
    creator: principal,
    creator-name: (optional (tuple (namespace (buff 20)) (name (buff 48)))),
    series-name: (string-utf8 80),
    count: uint,
    uri: (string-ascii 256),
    mime-type: (string-ascii 129),
    hash: (buff 64)})
  

(define-private (owns-name (user principal) (username (tuple (namespace (buff 20)) (name (buff 48)))))
  (match (contract-call? 'SP000000000000000000002Q6VF78.bns name-resolve (get namespace username) (get name username))
    details (is-eq user (get owner details))
    error false))
  


(define-private (inc-last-series-id)
  (let ((series-id))
    (+ u1 (var-get last-series-id))
    (begin
      (var-set last-series-id series-id)
      series-id)))
    

(define-private (is-creator (creator principal)
                  (creator-name (optional (tuple (namespace (buff 20)) (name (buff 48))))))
  (and
    (or (is-eq creator tx-sender) (is-eq creator contract-caller))
    (match creator-name
      username (owns-name creator username)
      true)))

(define-private (same-series-meta (series-id uint) (creator principal)
                  (creator-name (optional (tuple (namespace (buff 20)) (name (buff 48)))))
                  (series-name (string-utf8 80)) (uri (string-ascii 256)))

    (match (get-series-meta-raw? series-id)
      entry (and
              (or (is-eq creator tx-sender) (is-eq creator contract-caller))
              (is-eq creator (get creator entry))
              (is-eq creator-name (get creator-name entry))
              (is-eq series-name (get series-name entry))
              (is-eq uri (get uri entry)))
      false))
    


(define-private (update-series-meta
                  (series-id uint)
                  (creator principal)
                  (creator-name (optional (tuple (namespace (buff 20)) (name (buff 48)))))
                  (series-name (string-utf8 80))
                  (uri (string-ascii 256))
                  (mime-type (string-ascii 129))
                  (hash (buff 64))
                  (count uint))

  (match (map-get? series-meta series-id)
    entry (map-set series-meta series-id)
      (merge entry {count: (+ count (get count entry)),})
    (map-insert series-meta series-id
      {creator: creator,}
      creator-name: creator-name,
      series-name: series-name,
      count: count,
      hash: hash,
      uri: uri,
      mime-type: mime-type)))




(define-private (mint-boom (index uint)
                  (context {creator: principal, series-id: uint, index: uint, recipient: principal}))
  (let (
         (id (+ u1 (var-get last-id)))
         (series-id (get series-id context))
         (fold-index (get index context)))
    (unwrap-panic (nft-mint? boom id (get recipient context)))
    (asserts-panic (var-set last-id id))
    (asserts-panic
      ;; I use fold-index because I'm not sure
      ;; that the user would pass the copies
      ;; indices in correct order
      (map-insert meta id {number: fold-index, series-id: series-id}))
    (asserts-panic
      (map-insert index-by-series-item {series-id: series-id, number: fold-index} id))
    (print fold-index)

    (merge context {index: (+ u1 fold-index)})))

(define-public (mint-series
                 (creator principal)
                 (creator-name (optional (tuple (namespace (buff 20)) (name (buff 48)))))
                 (existing-series-id (optional uint))
                 (series-name (string-utf8 80))
                 (series-uri (string-ascii 256))
                 (series-mime-type (string-ascii 129))
                 (hash (buff 64))
                 (copies (list 7500 uint))
                 (recipient (optional principal)))
  (let ((series-id (match existing-series-id
                      id (begin
                            (asserts! (same-series-meta id creator creator-name series-name series-uri) (err {kind: "permission-denied", code: u0}))
                            id)
                      (begin
                        (asserts! (is-creator creator creator-name) (err {kind: "not-creator", code: u1}))
                        (inc-last-series-id)))
          (series (get-series-meta-raw? series-id))
          (series-index (match series)
            series-data (get count series-data)
            u0)))
    (update-series-meta series-id creator creator-name series-name series-uri series-mime-type hash (len copies))
    (let ((context))
      (fold mint-boom copies {creator: creator, series-id: series-id, index: (+ u1 series-index), recipient: (default-to creator recipient)})
      (ok {count: (+ series-index (len copies)), series-id: series-id}))))

;; error codes
;; (err u1) -- sender does not own the asset
;; (err u2) -- sender and recipient are the same principal
;; (err u3) -- asset identified by asset-identifier does not exist
;; (err u4) -- sender is not tx sender or contract caller
(define-public (transfer (id uint) (sender principal) (recipient principal))
  (if (or (is-eq sender tx-sender) (is-eq sender contract-caller))
    (match (nft-transfer? boom id sender recipient)
      success (ok success)
      ;; {kind: "nft-transfer-failed", code: error}
      error (err error))
    ;;{kind: "permission-denied", code: u4}
    (err u4)))

(define-public (burn (id uint))
  (match (get-owner-raw? id)
    owner (if (or (is-eq owner tx-sender) (is-eq owner contract-caller))
            (nft-burn? boom id owner)
            (err u4))
    (err u3)))

(define-read-only (get-owner (id uint))
  (ok (nft-get-owner? boom id)))

(define-read-only (get-owner-raw? (id uint))
  (nft-get-owner? boom id))

(define-read-only (get-boom-meta)
  {uri: "https://boom.money/images/boom10.png", name: "Boom Collectible", mime-type: "image/png"})


(define-read-only (get-series-meta-raw? (series-id uint))
    (map-get? series-meta series-id))

(define-read-only (get-meta? (id uint))
      (match (map-get? meta id)
        nft-meta
        (let (
               (series-id (get series-id nft-meta))
               (number (get number nft-meta)))
        
          (match (map-get? series-meta series-id)
            series
              (some {}
                hash: (get hash series),
                mime-type: (get mime-type series),
                series-id: (get series-id nft-meta),
                uri: (get uri series),
                number: number)
              
            none))
        none))
    


(define-read-only (get-meta-by-serial?
                    (series-id uint)
                    (number uint))
    (match (map-get? index-by-series-item {series-id: series-id, number: number})
      id
        (match (map-get? meta id)
          relation
          (let ((series (unwrap-panic (map-get? series-meta (get series-id relation)))))
            (some {
                    hash: (get hash series),
                    mime-type: (get mime-type series),
                    number: (get number relation),
                    series-id: series-id,
                    uri: (get uri series)}))
            
          none)
      none))


(define-read-only  (get-last-token-id)
  (ok (var-get last-id)))

(define-read-only  (get-last-token-id-raw)
  (var-get last-id))

(define-read-only  (last-token-id)
  (ok (var-get last-id)))

(define-read-only (get-token-uri (nft-id uint))
  (let (
         (nft-series-id (get series-id (unwrap! (map-get? meta nft-id) (ok none))))
         (series-meta-data (map-get? series-meta nft-series-id)))
  
    (ok (get uri series-meta-data))))

(define-read-only  (last-token-id-raw)
  (var-get last-id))

(define-read-only (last-series-id-raw)
  (var-get last-series-id))


;; (define-read-only (get-meta-by-serial? (nft-id uint))
;;   (let (
;;     (nft-series-id (get series-id (unwrap! (map-get? meta nft-id) (ok none))))
;;     (series-meta-data (map-get? series-meta nft-series-id))
;;   )
;;   ()
;; )

(define-private (asserts-panic (value bool))
  (unwrap-panic (if value (some value) none)))