#!/usr/bin/env node

/**
 * Export contract ABIs to frontend-friendly TypeScript format
 * Run after `forge build` to generate ABIs
 */

const fs = require('fs');
const path = require('path');

const CONTRACTS = [
  'TokenFactory',
  'BondingCurve',
  'XfernoToken',
];

const OUT_DIR = path.join(__dirname, '..', 'out');
const EXPORT_DIR = path.join(__dirname, '..', '..', '..', 'apps', 'web', 'src', 'lib', 'contracts');

// Ensure export directory exists
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

let abiExports = `/**
 * XFERNO Contract ABIs
 * Auto-generated from Solidity contracts
 * Run \`pnpm abi:export\` in packages/contracts to regenerate
 */

`;

for (const contract of CONTRACTS) {
  const artifactPath = path.join(OUT_DIR, `${contract}.sol`, `${contract}.json`);
  
  if (!fs.existsSync(artifactPath)) {
    console.error(`Artifact not found: ${artifactPath}`);
    console.error('Run `forge build` first');
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
  const abi = artifact.abi;

  // Convert to camelCase for export name
  const exportName = contract.charAt(0).toLowerCase() + contract.slice(1) + 'Abi';

  abiExports += `export const ${exportName} = ${JSON.stringify(abi, null, 2)} as const;\n\n`;

  console.log(`✓ Exported ${contract} ABI (${abi.length} items)`);
}

// Write ABIs file
fs.writeFileSync(path.join(EXPORT_DIR, 'abis.ts'), abiExports);
console.log(`\n✓ ABIs written to ${path.join(EXPORT_DIR, 'abis.ts')}`);

// Also create a deployments file template if it doesn't exist
const addressesPath = path.join(EXPORT_DIR, 'addresses.ts');
if (!fs.existsSync(addressesPath)) {
  const addressesTemplate = `/**
 * XFERNO Contract Addresses
 * Update these after deploying to each network
 */

import { type Address } from 'viem';

export interface ContractAddresses {
  tokenFactory: Address;
  bondingCurve: Address;
}

// Contract addresses per chain ID
export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  // Ethereum Mainnet
  1: {
    tokenFactory: '0x0000000000000000000000000000000000000000' as Address,
    bondingCurve: '0x0000000000000000000000000000000000000000' as Address,
  },
  // Sepolia Testnet
  11155111: {
    tokenFactory: '0x0000000000000000000000000000000000000000' as Address,
    bondingCurve: '0x0000000000000000000000000000000000000000' as Address,
  },
  // Base Mainnet
  8453: {
    tokenFactory: '0x0000000000000000000000000000000000000000' as Address,
    bondingCurve: '0x0000000000000000000000000000000000000000' as Address,
  },
  // Base Sepolia Testnet
  84532: {
    tokenFactory: '0x0000000000000000000000000000000000000000' as Address,
    bondingCurve: '0x0000000000000000000000000000000000000000' as Address,
  },
};

/**
 * Get contract addresses for a specific chain
 */
export function getContractAddresses(chainId: number): ContractAddresses | null {
  return CONTRACT_ADDRESSES[chainId] || null;
}

/**
 * Check if contracts are deployed on a chain
 */
export function isChainSupported(chainId: number): boolean {
  const addresses = CONTRACT_ADDRESSES[chainId];
  if (!addresses) return false;
  
  return (
    addresses.tokenFactory !== '0x0000000000000000000000000000000000000000' &&
    addresses.bondingCurve !== '0x0000000000000000000000000000000000000000'
  );
}

/**
 * Supported chain IDs
 */
export const SUPPORTED_CHAIN_IDS = Object.keys(CONTRACT_ADDRESSES).map(Number);
`;
  fs.writeFileSync(addressesPath, addressesTemplate);
  console.log(`✓ Created addresses template at ${addressesPath}`);
}

console.log('\nDone! Remember to update addresses.ts after deploying contracts.');
