/**
 * EVM Network Adapter
 *
 * Base adapter for Ethereum and EVM-compatible chains using viem
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  webSocket,
  type PublicClient,
  type WalletClient,
  type Transport,
  type Chain,
  formatUnits,
  parseUnits,
  type Address,
  type Abi,
  custom,
} from 'viem';

import { BaseNetworkAdapter } from '../base-adapter';
import type {
  NetworkConfig,
  TransactionReceipt,
  TokenBalance,
  GasEstimate,
  ContractReadParams,
  ContractWriteParams,
  TransactionLog,
} from '../types';

// Standard ERC20 ABI for token operations
const ERC20_ABI = [
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const;

/**
 * EVM Network Adapter
 */
export class EvmAdapter extends BaseNetworkAdapter {
  private publicClient: PublicClient | null = null;
  private walletClient: WalletClient | null = null;
  private unsubscribeBlock?: () => void;

  constructor(config: NetworkConfig) {
    super(config);
  }

  /**
   * Create viem chain config from NetworkConfig
   */
  private getChainConfig(): Chain {
    return {
      id: this.config.chainId!,
      name: this.config.name,
      nativeCurrency: this.config.nativeCurrency,
      rpcUrls: {
        default: {
          http: this.config.rpcUrls,
          webSocket: this.config.wsUrls,
        },
        public: {
          http: this.config.rpcUrls,
          webSocket: this.config.wsUrls,
        },
      },
      blockExplorers: {
        default: {
          name: 'Explorer',
          url: this.config.explorerUrls[0],
        },
      },
      testnet: this.config.isTestnet,
    };
  }

  /**
   * Get transport based on available endpoints
   */
  private getTransport(): Transport {
    if (this.config.wsUrls && this.config.wsUrls.length > 0) {
      return webSocket(this.config.wsUrls[0]);
    }
    return http(this.config.rpcUrls[0]);
  }

  async connect(): Promise<void> {
    try {
      const chain = this.getChainConfig();
      const transport = this.getTransport();

      // Create public client for reading
      this.publicClient = createPublicClient({
        chain,
        transport,
      });

      // Check if we have a browser wallet
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        this.walletClient = createWalletClient({
          chain,
          transport: custom((window as any).ethereum),
        });

        // Request accounts
        const accounts = await this.walletClient.requestAddresses();
        if (accounts.length > 0) {
          this.updateState({
            connected: true,
            address: accounts[0],
            chainId: this.config.chainId,
          });
        }
      } else {
        // Just mark as connected for read-only mode
        this.updateState({
          connected: true,
          chainId: this.config.chainId,
        });
      }
    } catch (error) {
      this.updateState({
        connected: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.unsubscribeBlock) {
      this.unsubscribeBlock();
      this.unsubscribeBlock = undefined;
    }
    this.publicClient = null;
    this.walletClient = null;
    this.updateState({
      connected: false,
      address: undefined,
      chainId: undefined,
    });
  }

  async getBlockNumber(): Promise<bigint> {
    this.ensureConnected();
    return this.publicClient!.getBlockNumber();
  }

  async getBalance(address: string): Promise<bigint> {
    this.ensureConnected();
    return this.publicClient!.getBalance({
      address: address as Address,
    });
  }

  async getTokenBalance(
    address: string,
    tokenAddress: string
  ): Promise<TokenBalance> {
    this.ensureConnected();

    const [balance, symbol, decimals] = await Promise.all([
      this.publicClient!.readContract({
        address: tokenAddress as Address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address as Address],
      }),
      this.publicClient!.readContract({
        address: tokenAddress as Address,
        abi: ERC20_ABI,
        functionName: 'symbol',
      }),
      this.publicClient!.readContract({
        address: tokenAddress as Address,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }),
    ]);

    return {
      address: tokenAddress,
      symbol: symbol as string,
      decimals: decimals as number,
      balance: balance as bigint,
      formatted: formatUnits(balance as bigint, decimals as number),
    };
  }

  async getTokenBalances(
    address: string,
    tokenAddresses: string[]
  ): Promise<TokenBalance[]> {
    return Promise.all(
      tokenAddresses.map((token) => this.getTokenBalance(address, token))
    );
  }

  async estimateGas(params: ContractWriteParams): Promise<GasEstimate> {
    this.ensureConnected();

    const gasLimit = await this.publicClient!.estimateContractGas({
      address: params.address as Address,
      abi: params.abi as Abi,
      functionName: params.functionName,
      args: params.args as any,
      value: params.value,
      account: this._state.address as Address,
    });

    const gasPrice = await this.publicClient!.getGasPrice();

    return {
      gasLimit,
      gasPrice,
      estimatedCost: gasLimit * gasPrice,
    };
  }

  async readContract<T = unknown>(params: ContractReadParams): Promise<T> {
    this.ensureConnected();

    const result = await this.publicClient!.readContract({
      address: params.address as Address,
      abi: params.abi as Abi,
      functionName: params.functionName,
      args: params.args as any,
    });

    return result as T;
  }

  async writeContract(params: ContractWriteParams): Promise<string> {
    this.ensureConnected();

    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    if (!this._state.address) {
      throw new Error('No account connected');
    }

    const hash = await this.walletClient.writeContract({
      address: params.address as Address,
      abi: params.abi as Abi,
      functionName: params.functionName,
      args: params.args as any,
      value: params.value,
      account: this._state.address as Address,
      chain: this.getChainConfig(),
      gas: params.gasLimit,
      gasPrice: params.gasPrice,
      maxFeePerGas: params.maxFeePerGas,
      maxPriorityFeePerGas: params.maxPriorityFeePerGas,
    });

    return hash;
  }

  async waitForTransaction(
    hash: string,
    confirmations = 1
  ): Promise<TransactionReceipt> {
    this.ensureConnected();

    const receipt = await this.publicClient!.waitForTransactionReceipt({
      hash: hash as `0x${string}`,
      confirmations,
    });

    return this.mapReceipt(receipt);
  }

  async getTransactionReceipt(
    hash: string
  ): Promise<TransactionReceipt | null> {
    this.ensureConnected();

    const receipt = await this.publicClient!.getTransactionReceipt({
      hash: hash as `0x${string}`,
    });

    return receipt ? this.mapReceipt(receipt) : null;
  }

  private mapReceipt(receipt: any): TransactionReceipt {
    return {
      hash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      transactionIndex: receipt.transactionIndex,
      gasUsed: receipt.gasUsed,
      effectiveGasPrice: receipt.effectiveGasPrice,
      status: receipt.status === 'success' ? 'success' : 'reverted',
      contractAddress: receipt.contractAddress ?? undefined,
      logs: receipt.logs.map((log: any): TransactionLog => ({
        logIndex: log.logIndex,
        address: log.address,
        topics: log.topics,
        data: log.data,
      })),
    };
  }

  onBlock(callback: (blockNumber: bigint) => void): () => void {
    this.ensureConnected();

    const unwatch = this.publicClient!.watchBlockNumber({
      onBlockNumber: callback,
    });

    this.unsubscribeBlock = unwatch;
    return unwatch;
  }

  onContractEvent(
    address: string,
    abi: readonly unknown[],
    eventName: string,
    callback: (log: unknown) => void
  ): () => void {
    this.ensureConnected();

    const unwatch = this.publicClient!.watchContractEvent({
      address: address as Address,
      abi: abi as Abi,
      eventName,
      onLogs: (logs) => {
        logs.forEach((log) => callback(log));
      },
    });

    return unwatch;
  }
}

/**
 * Factory function for creating EVM adapters
 */
export function createEvmAdapter(config: NetworkConfig): EvmAdapter {
  return new EvmAdapter(config);
}
