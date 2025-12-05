/**
 * XFERNO Contract ABIs
 * Generated from Solidity contracts for wagmi integration
 */

// TokenFactory ABI
export const tokenFactoryAbi = [
  // Events
  {
    type: 'event',
    name: 'TokenCreated',
    inputs: [
      { name: 'token', type: 'address', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'name', type: 'string', indexed: false },
      { name: 'symbol', type: 'string', indexed: false },
      { name: 'initialSupply', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TokenMetadata',
    inputs: [
      { name: 'token', type: 'address', indexed: true },
      { name: 'description', type: 'string', indexed: false },
      { name: 'imageUri', type: 'string', indexed: false },
      { name: 'socialLinks', type: 'string[]', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'BondingCurveUpdated',
    inputs: [
      { name: 'oldCurve', type: 'address', indexed: true },
      { name: 'newCurve', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'CreationFeeUpdated',
    inputs: [
      { name: 'oldFee', type: 'uint256', indexed: false },
      { name: 'newFee', type: 'uint256', indexed: false },
    ],
  },
  // Read Functions
  {
    type: 'function',
    name: 'bondingCurve',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'creationFee',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalTokens',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isXfernoToken',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTokensByCreator',
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTokens',
    inputs: [
      { name: 'offset', type: 'uint256' },
      { name: 'limit', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
  },
  // Write Functions
  {
    type: 'function',
    name: 'createToken',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'name', type: 'string' },
          { name: 'symbol', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'imageUri', type: 'string' },
          { name: 'socialLinks', type: 'string[]' },
        ],
      },
    ],
    outputs: [{ name: 'token', type: 'address' }],
    stateMutability: 'payable',
  },
] as const;

// BondingCurve ABI
export const bondingCurveAbi = [
  // Events
  {
    type: 'event',
    name: 'TokensBought',
    inputs: [
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'token', type: 'address', indexed: true },
      { name: 'ethAmount', type: 'uint256', indexed: false },
      { name: 'tokenAmount', type: 'uint256', indexed: false },
      { name: 'newPrice', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TokensSold',
    inputs: [
      { name: 'seller', type: 'address', indexed: true },
      { name: 'token', type: 'address', indexed: true },
      { name: 'tokenAmount', type: 'uint256', indexed: false },
      { name: 'ethAmount', type: 'uint256', indexed: false },
      { name: 'newPrice', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TokenGraduated',
    inputs: [
      { name: 'token', type: 'address', indexed: true },
      { name: 'dexPool', type: 'address', indexed: true },
      { name: 'ethLiquidity', type: 'uint256', indexed: false },
      { name: 'tokenLiquidity', type: 'uint256', indexed: false },
    ],
  },
  // Read Functions
  {
    type: 'function',
    name: 'curveParams',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'virtualEthReserve', type: 'uint256' },
          { name: 'virtualTokenReserve', type: 'uint256' },
          { name: 'graduationThreshold', type: 'uint256' },
          { name: 'feeBps', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTokenState',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'ethReserve', type: 'uint256' },
          { name: 'tokenSupply', type: 'uint256' },
          { name: 'graduated', type: 'bool' },
          { name: 'graduatedAt', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getBuyPrice',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'tokenAmount', type: 'uint256' },
    ],
    outputs: [{ name: 'ethCost', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getSellPrice',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'tokenAmount', type: 'uint256' },
    ],
    outputs: [{ name: 'ethReturn', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getCurrentPrice',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'canGraduate',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'dexFactory',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'feeRecipient',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  // Write Functions
  {
    type: 'function',
    name: 'buy',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'minTokens', type: 'uint256' },
    ],
    outputs: [{ name: 'tokenAmount', type: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'sell',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'tokenAmount', type: 'uint256' },
      { name: 'minEth', type: 'uint256' },
    ],
    outputs: [{ name: 'ethAmount', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'graduate',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ name: 'dexPool', type: 'address' }],
    stateMutability: 'nonpayable',
  },
] as const;

// XfernoToken (ERC20) ABI
export const xfernoTokenAbi = [
  // Events
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Graduated',
    inputs: [
      { name: 'dexPool', type: 'address', indexed: true },
      { name: 'liquidity', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TradingEnabled',
    inputs: [{ name: 'enabled', type: 'bool', indexed: false }],
  },
  // Read Functions
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'creator',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'bondingCurve',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tradingEnabled',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'graduated',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'graduatedAt',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'dexPool',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  // Write Functions
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const;
