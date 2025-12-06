#!/bin/bash
# XFERNO Contract Deployment Script for BlockDAG Awakening Testnet
# 
# Prerequisites:
# 1. Install Foundry: curl -L https://foundry.paradigm.xyz | bash && foundryup
# 2. Get testnet BDAG from https://blockdag.network/testnet
# 3. Set environment variables below

# ==================== CONFIGURATION ====================

# BlockDAG Awakening Testnet
export BDAG_RPC_URL="https://relay.awakening.bdagscan.com"
export BDAG_CHAIN_ID=1043
export BDAG_EXPLORER_URL="https://awakening.bdagscan.com"

# Your deployer private key (WITHOUT 0x prefix)
# IMPORTANT: Never commit this! Use environment variable or .env file
export PRIVATE_KEY="${BDAG_DEPLOYER_PRIVATE_KEY}"

# Fee recipient address (defaults to deployer if not set)
# export FEE_RECIPIENT="0x..."

# Contract parameters for testnet (lower values for testing)
export CREATION_FEE="1000000000000000"      # 0.001 BDAG
export VIRTUAL_ETH="30000000000000000000"   # 30 BDAG
export VIRTUAL_TOKEN="1000000000000000000000000000"  # 1B tokens
export GRADUATION_THRESHOLD="6900000000000000000"  # 6.9 BDAG (lower for testnet)
export FEE_BPS="100"                        # 1% platform fee

# ==================== DEPLOYMENT ====================

echo ""
echo "=============================================="
echo "   XFERNO Deployment to BlockDAG Awakening"
echo "=============================================="
echo ""
echo "Network: BlockDAG Awakening Testnet"
echo "Chain ID: ${BDAG_CHAIN_ID}"
echo "RPC: ${BDAG_RPC_URL}"
echo ""

# Check if private key is set
if [ -z "$PRIVATE_KEY" ]; then
    echo "ERROR: PRIVATE_KEY is not set!"
    echo "Set BDAG_DEPLOYER_PRIVATE_KEY environment variable"
    exit 1
fi

# Navigate to contracts directory
cd "$(dirname "$0")/.."

# Deploy contracts
echo "Deploying contracts..."
forge script script/Deploy.s.sol \
    --rpc-url "$BDAG_RPC_URL" \
    --broadcast \
    --slow \
    -vvvv

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "=============================================="
    echo "   Deployment Successful!"
    echo "=============================================="
    echo ""
    echo "Check your deployment at:"
    echo "${BDAG_EXPLORER_URL}"
    echo ""
    echo "Don't forget to:"
    echo "1. Save contract addresses to deployments/1043.json"
    echo "2. Update .env with contract addresses"
    echo "3. Verify contracts on explorer"
else
    echo ""
    echo "Deployment failed! Check the error above."
    exit 1
fi
