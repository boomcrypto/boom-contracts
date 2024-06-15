
# boom-shop

[`boom-shop.clar`](../contracts/boom-shop.clar)

Store Smart Contract

**Public functions:**

- [`add-manager`](#add-manager)
- [`remove-manager`](#remove-manager)
- [`update-store-info`](#update-store-info)
- [`add-product`](#add-product)
- [`remove-product`](#remove-product)
- [`update-product`](#update-product)
- [`add-shipping-option`](#add-shipping-option)
- [`purchase`](#purchase)

**Read-only functions:**



**Private functions:**

- [`is-admin`](#is-admin)
- [`is-manager`](#is-manager)

**Maps**

- [`store-managers`](#store-managers)
- [`products`](#products)
- [`shipping-options`](#shipping-options)
- [`orders`](#orders)

**Variables**

- [`store-name`](#store-name)
- [`store-description`](#store-description)
- [`store-logo`](#store-logo)
- [`store-banner`](#store-banner)
- [`product-counter`](#product-counter)
- [`order-counter`](#order-counter)

**Constants**

- [`ADMIN`](#admin)
- [`PRODUCT_MANAGER`](#product_manager)
- [`contract-owner`](#contract-owner)


## Functions

### add-manager

[View in file](../contracts/boom-shop.clar#L39)

`(define-public (add-manager ((manager principal) (role (string-ascii 15))) (response (string-ascii 26) (string-ascii 40)))`

Add a manager

<details>
  <summary>Source code:</summary>

```clarity
(define-public (add-manager (manager principal) (role (string-ascii 15)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err "Only the contract owner can add managers"))
    (asserts! (or (is-eq role ADMIN) (is-eq role PRODUCT_MANAGER)) (err "Invalid role"))
    (map-set store-managers { manager-principal: manager } { role: role })
    (ok "Manager added successfully")))
```
</details>


**Parameters:**

| Name | Type | 
| --- | --- | 
| manager | principal |
| role | (string-ascii 15) |

### remove-manager

[View in file](../contracts/boom-shop.clar#L48)

`(define-public (remove-manager ((manager principal)) (response (string-ascii 28) (string-ascii 43)))`

Remove a manager

<details>
  <summary>Source code:</summary>

```clarity
(define-public (remove-manager (manager principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err "Only the contract owner can remove managers"))
    (map-delete store-managers { manager-principal: manager })
    (ok "Manager removed successfully")))
```
</details>


**Parameters:**

| Name | Type | 
| --- | --- | 
| manager | principal |

### update-store-info

[View in file](../contracts/boom-shop.clar#L55)

`(define-public (update-store-info ((name (string-ascii 50)) (description (string-ascii 200)) (logo (string-ascii 100)) (banner (string-ascii 100))) (response (string-ascii 38) (string-ascii 12)))`

Update store information

<details>
  <summary>Source code:</summary>

```clarity
(define-public (update-store-info (name (string-ascii 50)) (description (string-ascii 200)) (logo (string-ascii 100)) (banner (string-ascii 100)))
  (begin
    (asserts! (is-admin tx-sender) (err "Unauthorized"))
    (var-set store-name name)
    (var-set store-description description)
    (var-set store-logo logo)
    (var-set store-banner banner)
    (ok "Store information updated successfully")))
```
</details>


**Parameters:**

| Name | Type | 
| --- | --- | 
| name | (string-ascii 50) |
| description | (string-ascii 200) |
| logo | (string-ascii 100) |
| banner | (string-ascii 100) |

### add-product

[View in file](../contracts/boom-shop.clar#L65)

`(define-public (add-product ((name (string-ascii 50)) (description (string-ascii 200)) (price uint) (discount-type (string-ascii 10)) (discount-value uint) (images (list 6 (string-ascii 100))) (shipping (string-ascii 50))) (response (string-ascii 26) (string-ascii 21)))`

Add a product

<details>
  <summary>Source code:</summary>

```clarity
(define-public (add-product (name (string-ascii 50)) (description (string-ascii 200)) (price uint) (discount-type (string-ascii 10)) (discount-value uint) (images (list 6 (string-ascii 100))) (shipping (string-ascii 50)))
  (begin
    (asserts! (is-manager tx-sender PRODUCT_MANAGER) (err "Unauthorized"))
    (asserts! (or (is-eq discount-type "percent") (is-eq discount-type "fixed")) (err "Invalid discount type"))
    (let ((product-id (var-get product-counter)))
      (map-set products { product-id: product-id } { name: name, description: description, price: price, discount-type: discount-type, discount-value: discount-value, images: images, shipping: shipping, active: true, timestamp: block-height })
      (var-set product-counter (+ product-id u1))
      (ok "Product added successfully"))))
```
</details>


**Parameters:**

| Name | Type | 
| --- | --- | 
| name | (string-ascii 50) |
| description | (string-ascii 200) |
| price | uint |
| discount-type | (string-ascii 10) |
| discount-value | uint |
| images | (list 6 (string-ascii 100)) |
| shipping | (string-ascii 50) |

### remove-product

[View in file](../contracts/boom-shop.clar#L75)

`(define-public (remove-product ((product-id uint)) (response (string-ascii 32) (string-ascii 22)))`

Remove a product (deactivate)

<details>
  <summary>Source code:</summary>

```clarity
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
```
</details>


**Parameters:**

| Name | Type | 
| --- | --- | 
| product-id | uint |

### update-product

[View in file](../contracts/boom-shop.clar#L89)

`(define-public (update-product ((product-id uint) (name (string-ascii 50)) (description (string-ascii 200)) (price uint) (discount-type (string-ascii 10)) (discount-value uint) (images (list 6 (string-ascii 100))) (shipping (string-ascii 50))) (response (string-ascii 28) (string-ascii 22)))`

Update a product

<details>
  <summary>Source code:</summary>

```clarity
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
```
</details>


**Parameters:**

| Name | Type | 
| --- | --- | 
| product-id | uint |
| name | (string-ascii 50) |
| description | (string-ascii 200) |
| price | uint |
| discount-type | (string-ascii 10) |
| discount-value | uint |
| images | (list 6 (string-ascii 100)) |
| shipping | (string-ascii 50) |

### add-shipping-option

[View in file](../contracts/boom-shop.clar#L104)

`(define-public (add-shipping-option ((region (string-ascii 50)) (amount uint)) (response (string-ascii 34) (string-ascii 12)))`

Add shipping option

<details>
  <summary>Source code:</summary>

```clarity
(define-public (add-shipping-option (region (string-ascii 50)) (amount uint))
  (begin
    (asserts! (is-admin tx-sender) (err "Unauthorized"))
    (map-set shipping-options { region: region } { amount: amount })
    (ok "Shipping option added successfully")))
```
</details>


**Parameters:**

| Name | Type | 
| --- | --- | 
| region | (string-ascii 50) |
| amount | uint |

### purchase

[View in file](../contracts/boom-shop.clar#L111)

`(define-public (purchase ((product-id uint) (txid (string-ascii 64))) (response (string-ascii 30) (string-ascii 24)))`

Purchase a product

<details>
  <summary>Source code:</summary>

```clarity
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
```
</details>


**Parameters:**

| Name | Type | 
| --- | --- | 
| product-id | uint |
| txid | (string-ascii 64) |

### is-admin

[View in file](../contracts/boom-shop.clar#L133)

`(define-private (is-admin ((principal principal)) bool)`

Helper functions

<details>
  <summary>Source code:</summary>

```clarity
(define-private (is-admin (principal principal))
  (or (is-eq principal contract-owner) (is-eq (get role (default-to { role: "" } (map-get? store-managers { manager-principal: principal }))) ADMIN)))
```
</details>


**Parameters:**

| Name | Type | 
| --- | --- | 
| principal | principal |

### is-manager

[View in file](../contracts/boom-shop.clar#L136)

`(define-private (is-manager ((principal principal) (role (string-ascii 15))) bool)`



<details>
  <summary>Source code:</summary>

```clarity
(define-private (is-manager (principal principal) (role (string-ascii 15)))
  (is-eq (get role (default-to { role: "" } (map-get? store-managers { manager-principal: principal }))) role))
```
</details>


**Parameters:**

| Name | Type | 
| --- | --- | 
| principal | principal |
| role | (string-ascii 15) |

## Maps

### store-managers

Define a map to store manager information

```clarity
(define-map store-managers
  { manager-principal: principal }
  { role: (string-ascii 15) })
```

[View in file](../contracts/boom-shop.clar#L8)

### products

Define a map to store product information

```clarity
(define-map products
  { product-id: uint }
  { name: (string-ascii 50), description: (string-ascii 200), price: uint, discount-type: (string-ascii 10), discount-value: uint, images: (list 6 (string-ascii 100)), shipping: (string-ascii 50), active: bool, timestamp: uint })
```

[View in file](../contracts/boom-shop.clar#L13)

### shipping-options

Define a map to store shipping options

```clarity
(define-map shipping-options
  { region: (string-ascii 50) }
  { amount: uint })
```

[View in file](../contracts/boom-shop.clar#L18)

### orders

Define a map to store orders

```clarity
(define-map orders
  { order-id: uint }
  { buyer: principal, product-id: uint, txid: (string-ascii 64), timestamp: uint })
```

[View in file](../contracts/boom-shop.clar#L23)

## Variables

### store-name

(string-ascii 50)

Store information

```clarity
(define-data-var store-name (string-ascii 50) "")
```

[View in file](../contracts/boom-shop.clar#L28)

### store-description

(string-ascii 200)



```clarity
(define-data-var store-description (string-ascii 200) "")
```

[View in file](../contracts/boom-shop.clar#L29)

### store-logo

(string-ascii 100)



```clarity
(define-data-var store-logo (string-ascii 100) "")
```

[View in file](../contracts/boom-shop.clar#L30)

### store-banner

(string-ascii 100)



```clarity
(define-data-var store-banner (string-ascii 100) "")
```

[View in file](../contracts/boom-shop.clar#L31)

### product-counter

uint



```clarity
(define-data-var product-counter uint u0)
```

[View in file](../contracts/boom-shop.clar#L32)

### order-counter

uint



```clarity
(define-data-var order-counter uint u0)
```

[View in file](../contracts/boom-shop.clar#L33)

## Constants

### ADMIN



Define constants for roles

```clarity
(define-constant ADMIN "admin")
```

[View in file](../contracts/boom-shop.clar#L4)

### PRODUCT_MANAGER





```clarity
(define-constant PRODUCT_MANAGER "product-manager")
```

[View in file](../contracts/boom-shop.clar#L5)

### contract-owner



Initialize the store with owner as the admin

```clarity
(define-constant contract-owner tx-sender)
```

[View in file](../contracts/boom-shop.clar#L36)
  