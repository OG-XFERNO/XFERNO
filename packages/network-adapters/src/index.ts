/**
 * XFERNO Network Adapters
 *
 * Multi-chain network abstraction layer for interacting with
 * different blockchain networks (EVM chains, Solana, etc.)
 */

// Core interfaces and types
export * from './types';
export * from './interfaces';

// Registry
export * from './registry';

// Base adapter
export * from './base-adapter';

// Re-export chain-specific adapters
export * as evm from './evm';
export * as solana from './solana';
