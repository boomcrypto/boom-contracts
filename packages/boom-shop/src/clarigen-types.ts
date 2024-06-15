
import type { TypedAbiArg, TypedAbiFunction, TypedAbiMap, TypedAbiVariable, Response } from '@clarigen/core';

export const contracts = {
  boomShop: {
  "functions": {
    isAdmin: {"name":"is-admin","access":"private","args":[{"name":"principal","type":"principal"}],"outputs":{"type":"bool"}} as TypedAbiFunction<[principal: TypedAbiArg<string, "principal">], boolean>,
    isManager: {"name":"is-manager","access":"private","args":[{"name":"principal","type":"principal"},{"name":"role","type":{"string-ascii":{"length":15}}}],"outputs":{"type":"bool"}} as TypedAbiFunction<[principal: TypedAbiArg<string, "principal">, role: TypedAbiArg<string, "role">], boolean>,
    addManager: {"name":"add-manager","access":"public","args":[{"name":"manager","type":"principal"},{"name":"role","type":{"string-ascii":{"length":15}}}],"outputs":{"type":{"response":{"ok":{"string-ascii":{"length":26}},"error":{"string-ascii":{"length":40}}}}}} as TypedAbiFunction<[manager: TypedAbiArg<string, "manager">, role: TypedAbiArg<string, "role">], Response<string, string>>,
    addProduct: {"name":"add-product","access":"public","args":[{"name":"name","type":{"string-ascii":{"length":50}}},{"name":"description","type":{"string-ascii":{"length":200}}},{"name":"price","type":"uint128"},{"name":"discount-type","type":{"string-ascii":{"length":10}}},{"name":"discount-value","type":"uint128"},{"name":"images","type":{"list":{"type":{"string-ascii":{"length":100}},"length":6}}},{"name":"shipping","type":{"string-ascii":{"length":50}}}],"outputs":{"type":{"response":{"ok":{"string-ascii":{"length":26}},"error":{"string-ascii":{"length":21}}}}}} as TypedAbiFunction<[name: TypedAbiArg<string, "name">, description: TypedAbiArg<string, "description">, price: TypedAbiArg<number | bigint, "price">, discountType: TypedAbiArg<string, "discountType">, discountValue: TypedAbiArg<number | bigint, "discountValue">, images: TypedAbiArg<string[], "images">, shipping: TypedAbiArg<string, "shipping">], Response<string, string>>,
    addShippingOption: {"name":"add-shipping-option","access":"public","args":[{"name":"region","type":{"string-ascii":{"length":50}}},{"name":"amount","type":"uint128"}],"outputs":{"type":{"response":{"ok":{"string-ascii":{"length":34}},"error":{"string-ascii":{"length":12}}}}}} as TypedAbiFunction<[region: TypedAbiArg<string, "region">, amount: TypedAbiArg<number | bigint, "amount">], Response<string, string>>,
    purchase: {"name":"purchase","access":"public","args":[{"name":"product-id","type":"uint128"},{"name":"txid","type":{"string-ascii":{"length":64}}}],"outputs":{"type":{"response":{"ok":{"string-ascii":{"length":30}},"error":{"string-ascii":{"length":24}}}}}} as TypedAbiFunction<[productId: TypedAbiArg<number | bigint, "productId">, txid: TypedAbiArg<string, "txid">], Response<string, string>>,
    removeManager: {"name":"remove-manager","access":"public","args":[{"name":"manager","type":"principal"}],"outputs":{"type":{"response":{"ok":{"string-ascii":{"length":28}},"error":{"string-ascii":{"length":43}}}}}} as TypedAbiFunction<[manager: TypedAbiArg<string, "manager">], Response<string, string>>,
    removeProduct: {"name":"remove-product","access":"public","args":[{"name":"product-id","type":"uint128"}],"outputs":{"type":{"response":{"ok":{"string-ascii":{"length":32}},"error":{"string-ascii":{"length":22}}}}}} as TypedAbiFunction<[productId: TypedAbiArg<number | bigint, "productId">], Response<string, string>>,
    updateProduct: {"name":"update-product","access":"public","args":[{"name":"product-id","type":"uint128"},{"name":"name","type":{"string-ascii":{"length":50}}},{"name":"description","type":{"string-ascii":{"length":200}}},{"name":"price","type":"uint128"},{"name":"discount-type","type":{"string-ascii":{"length":10}}},{"name":"discount-value","type":"uint128"},{"name":"images","type":{"list":{"type":{"string-ascii":{"length":100}},"length":6}}},{"name":"shipping","type":{"string-ascii":{"length":50}}}],"outputs":{"type":{"response":{"ok":{"string-ascii":{"length":28}},"error":{"string-ascii":{"length":22}}}}}} as TypedAbiFunction<[productId: TypedAbiArg<number | bigint, "productId">, name: TypedAbiArg<string, "name">, description: TypedAbiArg<string, "description">, price: TypedAbiArg<number | bigint, "price">, discountType: TypedAbiArg<string, "discountType">, discountValue: TypedAbiArg<number | bigint, "discountValue">, images: TypedAbiArg<string[], "images">, shipping: TypedAbiArg<string, "shipping">], Response<string, string>>,
    updateStoreInfo: {"name":"update-store-info","access":"public","args":[{"name":"name","type":{"string-ascii":{"length":50}}},{"name":"description","type":{"string-ascii":{"length":200}}},{"name":"logo","type":{"string-ascii":{"length":100}}},{"name":"banner","type":{"string-ascii":{"length":100}}}],"outputs":{"type":{"response":{"ok":{"string-ascii":{"length":38}},"error":{"string-ascii":{"length":12}}}}}} as TypedAbiFunction<[name: TypedAbiArg<string, "name">, description: TypedAbiArg<string, "description">, logo: TypedAbiArg<string, "logo">, banner: TypedAbiArg<string, "banner">], Response<string, string>>
  },
  "maps": {
    orders: {"name":"orders","key":{"tuple":[{"name":"order-id","type":"uint128"}]},"value":{"tuple":[{"name":"buyer","type":"principal"},{"name":"product-id","type":"uint128"},{"name":"timestamp","type":"uint128"},{"name":"txid","type":{"string-ascii":{"length":64}}}]}} as TypedAbiMap<{
  "orderId": number | bigint;
}, {
  "buyer": string;
  "productId": bigint;
  "timestamp": bigint;
  "txid": string;
}>,
    products: {"name":"products","key":{"tuple":[{"name":"product-id","type":"uint128"}]},"value":{"tuple":[{"name":"active","type":"bool"},{"name":"description","type":{"string-ascii":{"length":200}}},{"name":"discount-type","type":{"string-ascii":{"length":10}}},{"name":"discount-value","type":"uint128"},{"name":"images","type":{"list":{"type":{"string-ascii":{"length":100}},"length":6}}},{"name":"name","type":{"string-ascii":{"length":50}}},{"name":"price","type":"uint128"},{"name":"shipping","type":{"string-ascii":{"length":50}}},{"name":"timestamp","type":"uint128"}]}} as TypedAbiMap<{
  "productId": number | bigint;
}, {
  "active": boolean;
  "description": string;
  "discountType": string;
  "discountValue": bigint;
  "images": string[];
  "name": string;
  "price": bigint;
  "shipping": string;
  "timestamp": bigint;
}>,
    shippingOptions: {"name":"shipping-options","key":{"tuple":[{"name":"region","type":{"string-ascii":{"length":50}}}]},"value":{"tuple":[{"name":"amount","type":"uint128"}]}} as TypedAbiMap<{
  "region": string;
}, {
  "amount": bigint;
}>,
    storeManagers: {"name":"store-managers","key":{"tuple":[{"name":"manager-principal","type":"principal"}]},"value":{"tuple":[{"name":"role","type":{"string-ascii":{"length":15}}}]}} as TypedAbiMap<{
  "managerPrincipal": string;
}, {
  "role": string;
}>
  },
  "variables": {
    ADMIN: {
  name: 'ADMIN',
  type: {
    'string-ascii': {
      length: 5
    }
  },
  access: 'constant'
} as TypedAbiVariable<string>,
    PRODUCT_MANAGER: {
  name: 'PRODUCT_MANAGER',
  type: {
    'string-ascii': {
      length: 15
    }
  },
  access: 'constant'
} as TypedAbiVariable<string>,
    contractOwner: {
  name: 'contract-owner',
  type: 'principal',
  access: 'constant'
} as TypedAbiVariable<string>,
    orderCounter: {
  name: 'order-counter',
  type: 'uint128',
  access: 'variable'
} as TypedAbiVariable<bigint>,
    productCounter: {
  name: 'product-counter',
  type: 'uint128',
  access: 'variable'
} as TypedAbiVariable<bigint>,
    storeBanner: {
  name: 'store-banner',
  type: {
    'string-ascii': {
      length: 100
    }
  },
  access: 'variable'
} as TypedAbiVariable<string>,
    storeDescription: {
  name: 'store-description',
  type: {
    'string-ascii': {
      length: 200
    }
  },
  access: 'variable'
} as TypedAbiVariable<string>,
    storeLogo: {
  name: 'store-logo',
  type: {
    'string-ascii': {
      length: 100
    }
  },
  access: 'variable'
} as TypedAbiVariable<string>,
    storeName: {
  name: 'store-name',
  type: {
    'string-ascii': {
      length: 50
    }
  },
  access: 'variable'
} as TypedAbiVariable<string>
  },
  constants: {
  ADMIN: 'admin',
  PRODUCT_MANAGER: 'product-manager',
  contractOwner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  orderCounter: 0n,
  productCounter: 0n,
  storeBanner: '',
  storeDescription: '',
  storeLogo: '',
  storeName: ''
},
  "non_fungible_tokens": [
    
  ],
  "fungible_tokens":[],"epoch":"Epoch21","clarity_version":"Clarity1",
  contractName: 'boom-shop',
  }
} as const;

export const accounts = {"deployer":{"address":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM","balance":"100000000000000"},"wallet_1":{"address":"ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5","balance":"100000000000000"},"wallet_2":{"address":"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG","balance":"100000000000000"},"wallet_3":{"address":"ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC","balance":"100000000000000"},"wallet_4":{"address":"ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND","balance":"100000000000000"},"wallet_5":{"address":"ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB","balance":"100000000000000"},"wallet_6":{"address":"ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0","balance":"100000000000000"},"wallet_7":{"address":"ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ","balance":"100000000000000"},"wallet_8":{"address":"ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP","balance":"100000000000000"},"wallet_9":{"address":"STNHKEPYEPJ8ET55ZZ0M5A34J0R3N5FM2CMMMAZ6","balance":"100000000000000"}} as const;

export const identifiers = {"boomShop":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.boom-shop"} as const

export const simnet = {
  accounts,
  contracts,
  identifiers,
} as const;


export const deployments = {"boomShop":{"devnet":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.boom-shop","simnet":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.boom-shop","testnet":null,"mainnet":null}} as const;

export const project = {
  contracts,
  deployments,
} as const;
  