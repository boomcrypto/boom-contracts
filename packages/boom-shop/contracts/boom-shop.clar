;; Store Smart Contract

;; Define constants for roles
(define-constant ADMIN "admin")
(define-constant PRODUCT_MANAGER "product-manager")

;; Define a map to store manager information
(define-map store-managers
  { manager-principal: principal }
  { role: (string-ascii 15) })

;; Define a map to store product information
(define-map products
  { product-id: uint }
  { name: (string-ascii 50), description: (string-ascii 200), price: uint, discount-type: (string-ascii 10), discount-value: uint, images: (list 6 (string-ascii 100)), shipping: (string-ascii 50), active: bool, timestamp: uint })

;; Define a map to store shipping options
(define-map shipping-options
  { region: (string-ascii 50) }
  { amount: uint })

;; Define a map to store orders
(define-map orders
  { order-id: uint }
  { buyer: principal, product-id: uint, txid: (string-ascii 64), timestamp: uint })

;; Store information
(define-data-var store-name (string-ascii 50) "")
(define-data-var store-description (string-ascii 200) "")
(define-data-var store-logo (string-ascii 100) "")
(define-data-var store-banner (string-ascii 100) "")
(define-data-var product-counter uint u0)
(define-data-var order-counter uint u0)

;; Initialize the store with owner as the admin
(define-constant contract-owner tx-sender)

;; Add a manager
(define-public (add-manager (manager principal) (role (string-ascii 15)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err "Only the contract owner can add managers"))
    (asserts! (or (is-eq role ADMIN) (is-eq role PRODUCT_MANAGER)) (err "Invalid role"))
    (map-set store-managers { manager-principal: manager } { role: role })
    (ok "Manager added successfully")))


;; Remove a manager
(define-public (remove-manager (manager principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err "Only the contract owner can remove managers"))
    (map-delete store-managers { manager-principal: manager })
    (ok "Manager removed successfully")))

;; Update store information
(define-public (update-store-info (name (string-ascii 50)) (description (string-ascii 200)) (logo (string-ascii 100)) (banner (string-ascii 100)))
  (begin
    (asserts! (is-admin tx-sender) (err "Unauthorized"))
    (var-set store-name name)
    (var-set store-description description)
    (var-set store-logo logo)
    (var-set store-banner banner)
    (ok "Store information updated successfully")))

;; Add a product
(define-public (add-product (name (string-ascii 50)) (description (string-ascii 200)) (price uint) (discount-type (string-ascii 10)) (discount-value uint) (images (list 6 (string-ascii 100))) (shipping (string-ascii 50)))
  (begin
    (asserts! (is-manager tx-sender PRODUCT_MANAGER) (err "Unauthorized"))
    (asserts! (or (is-eq discount-type "percent") (is-eq discount-type "fixed")) (err "Invalid discount type"))
    (let ((product-id (var-get product-counter)))
      (map-set products { product-id: product-id } { name: name, description: description, price: price, discount-type: discount-type, discount-value: discount-value, images: images, shipping: shipping, active: true, timestamp: block-height })
      (var-set product-counter (+ product-id u1))
      (ok "Product added successfully"))))

;; Remove a product (deactivate)
(define-public (remove-product (product-id uint))
  (begin
    (asserts! (is-manager tx-sender PRODUCT_MANAGER) (err "Unauthorized"))
    (let ((existing-product (map-get? products { product-id: product-id })))
      (asserts! (is-some existing-product) (err "Product does not exist"))
      (map-set products { product-id: product-id }
        (merge (unwrap! existing-product (err "Unexpected error")) { active: false, timestamp: block-height }))
      (ok "Product deactivated successfully")
    )
  )
)


;; Update a product
(define-public (update-product (product-id uint) (name (string-ascii 50)) (description (string-ascii 200)) (price uint) (discount-type (string-ascii 10)) (discount-value uint) (images (list 6 (string-ascii 100))) (shipping (string-ascii 50)))
  (begin
    (asserts! (is-manager tx-sender PRODUCT_MANAGER) (err "Unauthorized"))
    (asserts! (or (is-eq discount-type "percent") (is-eq discount-type "fixed")) (err "Invalid discount type"))
    (let ((existing-product (map-get? products { product-id: product-id })))
      (asserts! (is-some existing-product) (err "Product does not exist"))
      (map-set products { product-id: product-id }
        (merge (unwrap! existing-product (err "Unexpected error")) { name: name, description: description, price: price, discount-type: discount-type, discount-value: discount-value, images: images, shipping: shipping, timestamp: block-height }))
      (ok "Product updated successfully")
    )
  )
)


;; Add shipping option
(define-public (add-shipping-option (region (string-ascii 50)) (amount uint))
  (begin
    (asserts! (is-admin tx-sender) (err "Unauthorized"))
    (map-set shipping-options { region: region } { amount: amount })
    (ok "Shipping option added successfully")))

;; Purchase a product
(define-public (purchase (product-id uint) (txid (string-ascii 64)))
  (begin
    (let ((order-id (var-get order-counter)))
      ;; Check if the product exists
      (asserts! (is-some (map-get? products { product-id: product-id })) (err "Product does not exist"))
      ;; Retrieve the product details
      (let ((product (unwrap! (map-get? products { product-id: product-id }) (err "Product retrieval failed"))))
        ;; Check if the product is active
        (asserts! (get active product) (err "Product is not active"))
        ;; Record the purchase
        (map-set orders { order-id: order-id } { buyer: tx-sender, product-id: product-id, txid: txid, timestamp: block-height })
        ;; Increment the order counter
        (var-set order-counter (+ order-id u1))
        ;; Return success message
        (ok "Purchase recorded successfully")
      )
    )
  )
)


;; Helper functions
(define-private (is-admin (principal principal))
  (or (is-eq principal contract-owner) (is-eq (get role (default-to { role: "" } (map-get? store-managers { manager-principal: principal }))) ADMIN)))

(define-private (is-manager (principal principal) (role (string-ascii 15)))
  (is-eq (get role (default-to { role: "" } (map-get? store-managers { manager-principal: principal }))) role))