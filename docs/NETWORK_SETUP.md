# XFERNO Network Setup Guide

This guide covers how to add supported networks to MetaMask and obtain testnet ETH for development and deployment.

---

## Table of Contents
- [Testnets](#testnets)
  - [Sepolia (Ethereum Testnet)](#sepolia-ethereum-testnet)
  - [Base Sepolia](#base-sepolia)
- [Mainnets](#mainnets)
  - [Ethereum Mainnet](#ethereum-mainnet)
  - [Base](#base)
  - [Arbitrum One](#arbitrum-one)
  - [Optimism](#optimism)
- [Quick Reference](#quick-reference)

---

## Testnets

### Sepolia (Ethereum Testnet)

**Chain ID:** `11155111`

#### Adding to MetaMask
Sepolia is built into MetaMask:
1. Open MetaMask
2. Click the network dropdown (top left)
3. Toggle **"Show test networks"** ON
4. Select **"Sepolia"**

#### Faucets (Free Testnet ETH)
| Faucet | Link | Notes |
|--------|------|-------|
| Alchemy | https://www.alchemy.com/faucets/ethereum-sepolia | Requires Alchemy account |
| Chainlink | https://faucets.chain.link/sepolia | Requires 0.001 ETH on mainnet |
| QuickNode | https://faucet.quicknode.com/ethereum/sepolia | Free, easy |
| Infura | https://www.infura.io/faucet/sepolia | Requires Infura account |
| Google Cloud | https://cloud.google.com/application/web3/faucet/ethereum/sepolia | Free |

#### RPC Endpoints
```
Public: https://rpc.sepolia.org
Alchemy: https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
Infura: https://sepolia.infura.io/v3/YOUR_KEY
```

#### Block Explorer
https://sepolia.etherscan.io

---

### Base Sepolia

**Chain ID:** `84532`

#### Adding to MetaMask
1. Open MetaMask → Click network dropdown → **"Add network"**
2. Click **"Add a network manually"**
3. Enter:

| Field | Value |
|-------|-------|
| Network Name | `Base Sepolia` |
| RPC URL | `https://sepolia.base.org` |
| Chain ID | `84532` |
| Currency Symbol | `ETH` |
| Block Explorer URL | `https://sepolia.basescan.org` |

4. Click **Save**

#### Faucets (Free Testnet ETH)
| Faucet | Link | Notes |
|--------|------|-------|
| Alchemy | https://www.alchemy.com/faucets/base-sepolia | Requires Alchemy account |
| QuickNode | https://faucet.quicknode.com/base/sepolia | Free |
| Superchain | https://app.optimism.io/faucet | Works for Base Sepolia |
| Coinbase | https://portal.cdp.coinbase.com/products/faucet | Requires Coinbase account |

#### RPC Endpoints
```
Public: https://sepolia.base.org
Alchemy: https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
```

#### Block Explorer
https://sepolia.basescan.org

---

## Mainnets

> ⚠️ **Warning:** Mainnets use real money. Only deploy when thoroughly tested on testnets.

### Ethereum Mainnet

**Chain ID:** `1`

#### Adding to MetaMask
Ethereum Mainnet is the default network in MetaMask.

#### RPC Endpoints
```
Alchemy: https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
Infura: https://mainnet.infura.io/v3/YOUR_KEY
```

#### Block Explorer
https://etherscan.io

---

### Base

**Chain ID:** `8453`

#### Adding to MetaMask
1. Open MetaMask → Click network dropdown → **"Add network"**
2. Click **"Add a network manually"**
3. Enter:

| Field | Value |
|-------|-------|
| Network Name | `Base` |
| RPC URL | `https://mainnet.base.org` |
| Chain ID | `8453` |
| Currency Symbol | `ETH` |
| Block Explorer URL | `https://basescan.org` |

4. Click **Save**

#### RPC Endpoints
```
Public: https://mainnet.base.org
Alchemy: https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
```

#### Block Explorer
https://basescan.org

---

### Arbitrum One

**Chain ID:** `42161`

#### Adding to MetaMask
1. Open MetaMask → Click network dropdown → **"Add network"**
2. Click **"Add a network manually"**
3. Enter:

| Field | Value |
|-------|-------|
| Network Name | `Arbitrum One` |
| RPC URL | `https://arb1.arbitrum.io/rpc` |
| Chain ID | `42161` |
| Currency Symbol | `ETH` |
| Block Explorer URL | `https://arbiscan.io` |

4. Click **Save**

#### RPC Endpoints
```
Public: https://arb1.arbitrum.io/rpc
Alchemy: https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
```

#### Block Explorer
https://arbiscan.io

---

### Optimism

**Chain ID:** `10`

#### Adding to MetaMask
1. Open MetaMask → Click network dropdown → **"Add network"**
2. Click **"Add a network manually"**
3. Enter:

| Field | Value |
|-------|-------|
| Network Name | `Optimism` |
| RPC URL | `https://mainnet.optimism.io` |
| Chain ID | `10` |
| Currency Symbol | `ETH` |
| Block Explorer URL | `https://optimistic.etherscan.io` |

4. Click **Save**

#### RPC Endpoints
```
Public: https://mainnet.optimism.io
Alchemy: https://opt-mainnet.g.alchemy.com/v2/YOUR_KEY
```

#### Block Explorer
https://optimistic.etherscan.io

---

## Quick Reference

### All Networks Summary

| Network | Chain ID | Type | Currency |
|---------|----------|------|----------|
| Ethereum Mainnet | 1 | Mainnet | ETH |
| Sepolia | 11155111 | Testnet | ETH |
| Base | 8453 | Mainnet | ETH |
| Base Sepolia | 84532 | Testnet | ETH |
| Arbitrum One | 42161 | Mainnet | ETH |
| Optimism | 10 | Mainnet | ETH |

### Deployment Commands

```bash
# Navigate to contracts
cd packages/contracts

# Copy environment template
cp .env.example .env

# Edit .env with your private key and RPC URLs
# Then deploy:

# Sepolia Testnet
pnpm deploy:sepolia

# Base Sepolia Testnet
pnpm deploy:base-sepolia

# Dry run (simulation without broadcasting)
pnpm deploy:sepolia:dry
pnpm deploy:base-sepolia:dry
```

### After Deployment

1. Copy contract addresses from deployment output
2. Update `apps/web/src/lib/contracts/addresses.ts` with new addresses
3. Verify contracts are working on block explorer
4. Test token creation on the frontend

---

## Troubleshooting

### "Insufficient funds"
- Get more testnet ETH from faucets above
- Ensure you're on the correct network

### "Nonce too high" or "Nonce too low"
- Reset MetaMask account: Settings → Advanced → Clear activity tab data

### "Transaction underpriced"
- Increase gas price in MetaMask transaction settings

### RPC Connection Issues
- Try a different RPC endpoint
- Check if your API key is valid
- Some public RPCs have rate limits

---

## Getting API Keys

### Alchemy (Recommended)
1. Go to https://www.alchemy.com
2. Create free account
3. Create new app for each network
4. Copy API key from dashboard

### Etherscan (for contract verification)
1. Go to https://etherscan.io/register
2. Create account
3. Go to API Keys section
4. Generate new API key

### Basescan
1. Go to https://basescan.org/register
2. Create account (or use same as Etherscan)
3. Generate API key
