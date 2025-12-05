# XFERNO Smart Contract Deployment Guide

This guide covers deploying XFERNO contracts to various networks.

## Prerequisites

1. **Install Foundry**
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Install Dependencies**
   ```bash
   cd packages/contracts
   forge install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PRIVATE_KEY` | Yes | Deployer wallet private key (without 0x) |
| `SEPOLIA_RPC_URL` | For Sepolia | Sepolia RPC endpoint |
| `BASE_SEPOLIA_RPC_URL` | For Base Sepolia | Base Sepolia RPC endpoint |
| `ETHERSCAN_API_KEY` | For verification | Etherscan API key |
| `BASESCAN_API_KEY` | For Base verification | Basescan API key |

## Deployment Commands

### Dry Run (Simulation)

Test deployment without broadcasting:

```bash
# Sepolia
pnpm deploy:sepolia:dry

# Base Sepolia
pnpm deploy:base-sepolia:dry
```

### Live Deployment

Deploy and verify contracts:

```bash
# Sepolia Testnet
pnpm deploy:sepolia

# Base Sepolia Testnet
pnpm deploy:base-sepolia
```

### Manual Deployment

For custom configuration:

```bash
# Deploy with custom parameters
CREATION_FEE=1000000000000000 \
GRADUATION_THRESHOLD=10000000000000000000 \
forge script script/Deploy.s.sol \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

## Post-Deployment Steps

### 1. Verify Contracts (if not auto-verified)

```bash
# Verify BondingCurve
forge verify-contract \
  --chain sepolia \
  --constructor-args $(cast abi-encode "constructor(address,address,address,(uint256,uint256,uint256,uint256))" \
    $OWNER $DEX_FACTORY $FEE_RECIPIENT "(30000000000000000000,1000000000000000000000000000,69000000000000000000,100)") \
  $BONDING_CURVE_ADDRESS \
  src/curve/BondingCurve.sol:BondingCurve

# Verify TokenFactory
forge verify-contract \
  --chain sepolia \
  --constructor-args $(cast abi-encode "constructor(address,address,uint256)" \
    $OWNER $BONDING_CURVE_ADDRESS $CREATION_FEE) \
  $TOKEN_FACTORY_ADDRESS \
  src/factory/TokenFactory.sol:TokenFactory
```

### 2. Update Frontend Addresses

Edit `apps/web/src/lib/contracts/addresses.ts`:

```typescript
// Sepolia Testnet
11155111: {
  addresses: {
    tokenFactory: '0xYOUR_TOKEN_FACTORY_ADDRESS' as Address,
    bondingCurve: '0xYOUR_BONDING_CURVE_ADDRESS' as Address,
  },
  creationFee: BigInt('1000000000000000'), // 0.001 ETH
  blockExplorer: 'https://sepolia.etherscan.io',
},
```

### 3. Export ABIs (Optional)

If contracts change, regenerate ABIs:

```bash
pnpm abi:export
```

## Deployment Configurations

### Testnet (Sepolia)
- Creation Fee: 0.001 ETH
- Virtual ETH Reserve: 3 ETH
- Graduation Threshold: 6.9 ETH
- Platform Fee: 1%

### Testnet (Base Sepolia)
- Creation Fee: 0.0001 ETH
- Virtual ETH Reserve: 1 ETH
- Graduation Threshold: 2 ETH
- Platform Fee: 1%

### Mainnet (Future)
- Creation Fee: 0.01 ETH
- Virtual ETH Reserve: 30 ETH
- Graduation Threshold: 69 ETH
- Platform Fee: 1%

## Contract Addresses

Deployment addresses are saved to `deployments/<chainId>.json` after each deployment.

### Sepolia (Chain ID: 11155111)
```
TokenFactory: TBD
BondingCurve: TBD
```

### Base Sepolia (Chain ID: 84532)
```
TokenFactory: TBD
BondingCurve: TBD
```

## Testing Deployment

After deployment, test the contracts:

```bash
# Run tests against deployed contracts
forge test --fork-url $SEPOLIA_RPC_URL

# Test token creation
cast send $TOKEN_FACTORY_ADDRESS \
  "createToken((string,string,string,string,string[]))" \
  "(Test Token,TEST,A test token,https://example.com/logo.png,[])" \
  --value 0.001ether \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

## Troubleshooting

### "Insufficient funds"
Ensure your wallet has enough ETH for gas + creation fee.

### "Transaction reverted"
Check constructor arguments match expected types.

### "Verification failed"
- Ensure correct compiler version (0.8.24)
- Verify optimizer settings match foundry.toml
- Check constructor arguments encoding

## Security Notes

- Never commit `.env` files
- Use hardware wallets for mainnet deployments
- Test thoroughly on testnet before mainnet
- Consider using a multisig for contract ownership
