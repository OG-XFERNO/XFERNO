/**
 * Network Adapter Registry
 *
 * Central registry for managing network adapters across different chains
 */

import type { NetworkId } from '@xferno/types';
import type { INetworkAdapter } from './interfaces';
import type { NetworkConfig, ChainFamily } from './types';

/**
 * Adapter factory function type
 */
export type AdapterFactory = (config: NetworkConfig) => INetworkAdapter;

/**
 * Registry entry
 */
interface RegistryEntry {
  config: NetworkConfig;
  factory: AdapterFactory;
  instance?: INetworkAdapter;
}

/**
 * Network Adapter Registry
 *
 * Singleton registry that manages all network adapters
 */
export class NetworkAdapterRegistry {
  private static _instance: NetworkAdapterRegistry;
  private adapters: Map<NetworkId, RegistryEntry> = new Map();
  private factories: Map<ChainFamily, AdapterFactory> = new Map();

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): NetworkAdapterRegistry {
    if (!NetworkAdapterRegistry._instance) {
      NetworkAdapterRegistry._instance = new NetworkAdapterRegistry();
    }
    return NetworkAdapterRegistry._instance;
  }

  /**
   * Register a factory for a chain family
   */
  public registerFactory(family: ChainFamily, factory: AdapterFactory): void {
    this.factories.set(family, factory);
  }

  /**
   * Register a network configuration
   */
  public registerNetwork(config: NetworkConfig): void {
    const factory = this.factories.get(config.family);
    if (!factory) {
      throw new Error(`No factory registered for chain family: ${config.family}`);
    }

    this.adapters.set(config.id, {
      config,
      factory,
    });
  }

  /**
   * Register multiple networks at once
   */
  public registerNetworks(configs: NetworkConfig[]): void {
    configs.forEach((config) => this.registerNetwork(config));
  }

  /**
   * Get an adapter for a network
   */
  public getAdapter(networkId: NetworkId): INetworkAdapter {
    const entry = this.adapters.get(networkId);
    if (!entry) {
      throw new Error(`No adapter registered for network: ${networkId}`);
    }

    // Create instance if not exists (lazy initialization)
    if (!entry.instance) {
      entry.instance = entry.factory(entry.config);
    }

    return entry.instance;
  }

  /**
   * Get adapter if it exists, without throwing
   */
  public getAdapterOrNull(networkId: NetworkId): INetworkAdapter | null {
    try {
      return this.getAdapter(networkId);
    } catch {
      return null;
    }
  }

  /**
   * Check if a network is registered
   */
  public hasNetwork(networkId: NetworkId): boolean {
    return this.adapters.has(networkId);
  }

  /**
   * Get all registered network IDs
   */
  public getNetworkIds(): NetworkId[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Get all registered network configs
   */
  public getNetworkConfigs(): NetworkConfig[] {
    return Array.from(this.adapters.values()).map((entry) => entry.config);
  }

  /**
   * Get networks by chain family
   */
  public getNetworksByFamily(family: ChainFamily): NetworkConfig[] {
    return this.getNetworkConfigs().filter((config) => config.family === family);
  }

  /**
   * Get mainnet networks only
   */
  public getMainnets(): NetworkConfig[] {
    return this.getNetworkConfigs().filter((config) => !config.isTestnet);
  }

  /**
   * Get testnet networks only
   */
  public getTestnets(): NetworkConfig[] {
    return this.getNetworkConfigs().filter((config) => config.isTestnet);
  }

  /**
   * Clear a specific adapter instance (useful for reconnection)
   */
  public clearAdapter(networkId: NetworkId): void {
    const entry = this.adapters.get(networkId);
    if (entry) {
      entry.instance = undefined;
    }
  }

  /**
   * Clear all adapter instances
   */
  public clearAllAdapters(): void {
    this.adapters.forEach((entry) => {
      entry.instance = undefined;
    });
  }

  /**
   * Unregister a network
   */
  public unregisterNetwork(networkId: NetworkId): boolean {
    return this.adapters.delete(networkId);
  }

  /**
   * Reset the registry (useful for testing)
   */
  public reset(): void {
    this.adapters.clear();
    this.factories.clear();
  }
}

/**
 * Default registry instance
 */
export const registry = NetworkAdapterRegistry.getInstance();
