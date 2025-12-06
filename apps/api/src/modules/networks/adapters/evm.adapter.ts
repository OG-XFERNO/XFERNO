import { Logger } from '@nestjs/common';
import { NetworkType } from '@prisma/client';
import { ethers } from 'ethers';
import {
  INetworkAdapter,
  NetworkConfig,
  GasEstimate,
  DeployTokenParams,
  DeployTokenResult,
  DeployBridgeParams,
  DeployBridgeResult,
  DeployPoolParams,
  DeployPoolResult,
  TransactionParams,
  TransactionResult,
} from '../interfaces/network-adapter.interface';

// ABI for basic ERC20 operations
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)',
];

/**
 * Base EVM Network Adapter
 * Handles all EVM-compatible chains (ETH, BDAG, Arbitrum, Base, etc.)
 */
export class EVMAdapter implements INetworkAdapter {
  protected readonly logger = new Logger(EVMAdapter.name);
  protected provider: ethers.JsonRpcProvider | null = null;
  protected config: NetworkConfig | null = null;
  protected signer: ethers.Wallet | null = null;

  public readonly networkId: string;
  public readonly networkType: NetworkType = NetworkType.EVM;
  public readonly chainId: number | null;

  constructor(networkId: string, chainId: number | null = null) {
    this.networkId = networkId;
    this.chainId = chainId;
  }

  async initialize(config: NetworkConfig): Promise<void> {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl, config.chainId ?? undefined);

    // Initialize signer if private key is available
    const privateKey = process.env[`${this.networkId}_DEPLOYER_PRIVATE_KEY`] || process.env.DEPLOYER_PRIVATE_KEY;
    if (privateKey) {
      this.signer = new ethers.Wallet(privateKey, this.provider);
      this.logger.log(`Initialized signer for ${config.name}`);
    }

    this.logger.log(`EVMAdapter initialized for ${config.name} (chainId: ${config.chainId})`);
  }

  async isConnected(): Promise<boolean> {
    if (!this.provider) return false;
    try {
      await this.provider.getBlockNumber();
      return true;
    } catch {
      return false;
    }
  }

  async getBalance(address: string): Promise<bigint> {
    if (!this.provider) throw new Error('Provider not initialized');
    return await this.provider.getBalance(address);
  }

  async getTokenBalance(tokenAddress: string, ownerAddress: string): Promise<bigint> {
    if (!this.provider) throw new Error('Provider not initialized');
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    return await contract.balanceOf(ownerAddress);
  }

  async estimateDeployToken(params: DeployTokenParams): Promise<GasEstimate> {
    if (!this.provider) throw new Error('Provider not initialized');

    // Get bytecode for XfernoToken contract
    const bytecode = this.getTokenBytecode(params);
    
    const gasLimit = await this.provider.estimateGas({
      data: bytecode,
    });

    const feeData = await this.provider.getFeeData();
    const gasPrice = feeData.gasPrice ?? BigInt(0);

    return {
      gasLimit,
      gasPrice,
      maxFeePerGas: feeData.maxFeePerGas ?? undefined,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
      estimatedCost: gasLimit * gasPrice,
    };
  }

  async deployToken(params: DeployTokenParams): Promise<DeployTokenResult> {
    if (!this.signer) throw new Error('Signer not initialized');

    this.logger.log(`Deploying token ${params.name} (${params.symbol}) on ${this.config?.name}`);

    // Import the TokenFactory contract
    const factoryAddress = this.getFactoryAddress();
    const factoryAbi = this.getFactoryAbi();
    
    const factory = new ethers.Contract(factoryAddress, factoryAbi, this.signer);

    const tx = await factory.createToken(
      params.name,
      params.symbol,
      params.totalSupply,
      params.owner,
    );

    const receipt = await tx.wait();

    // Parse the TokenCreated event to get the token address
    const tokenCreatedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed?.name === 'TokenCreated';
      } catch {
        return false;
      }
    });

    if (!tokenCreatedEvent) {
      throw new Error('TokenCreated event not found in transaction receipt');
    }

    const parsedEvent = factory.interface.parseLog(tokenCreatedEvent);
    const tokenAddress = parsedEvent?.args?.tokenAddress || parsedEvent?.args?.[0];

    this.logger.log(`Token deployed at ${tokenAddress}`);

    return {
      tokenAddress,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  }

  async estimateDeployBridge(params: DeployBridgeParams): Promise<GasEstimate> {
    if (!this.provider) throw new Error('Provider not initialized');

    // Estimate gas for bridge deployment
    // This will depend on the bridge type
    const estimatedGas = BigInt(500000); // Placeholder
    const feeData = await this.provider.getFeeData();
    const gasPrice = feeData.gasPrice ?? BigInt(0);

    return {
      gasLimit: estimatedGas,
      gasPrice,
      maxFeePerGas: feeData.maxFeePerGas ?? undefined,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
      estimatedCost: estimatedGas * gasPrice,
    };
  }

  async deployBridge(params: DeployBridgeParams): Promise<DeployBridgeResult> {
    if (!this.signer) throw new Error('Signer not initialized');

    this.logger.log(`Deploying ${params.bridgeType} bridge for token ${params.tokenAddress}`);

    // TODO: Implement actual bridge deployment
    // This will be implemented in Phase 4 when we add full bridge support
    throw new Error('Bridge deployment not yet implemented');
  }

  async estimateDeployPool(params: DeployPoolParams): Promise<GasEstimate> {
    if (!this.provider) throw new Error('Provider not initialized');

    // Estimate gas for pool creation + liquidity add
    const estimatedGas = BigInt(400000); // Approximate for createPair + addLiquidity
    const feeData = await this.provider.getFeeData();
    const gasPrice = feeData.gasPrice ?? BigInt(0);

    return {
      gasLimit: estimatedGas,
      gasPrice,
      maxFeePerGas: feeData.maxFeePerGas ?? undefined,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
      estimatedCost: estimatedGas * gasPrice,
    };
  }

  async deployPool(params: DeployPoolParams): Promise<DeployPoolResult> {
    if (!this.signer) throw new Error('Signer not initialized');

    this.logger.log(`Creating pool for token ${params.tokenAddress}`);

    // Get router contract
    const routerAddress = this.getRouterAddress();
    const routerAbi = this.getRouterAbi();
    const router = new ethers.Contract(routerAddress, routerAbi, this.signer);

    // Approve token spending
    const tokenContract = new ethers.Contract(
      params.tokenAddress,
      ['function approve(address spender, uint256 amount) returns (bool)'],
      this.signer,
    );
    const approveTx = await tokenContract.approve(routerAddress, params.initialTokenAmount);
    await approveTx.wait();

    // Add liquidity
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const tx = await router.addLiquidityETH(
      params.tokenAddress,
      params.initialTokenAmount,
      0, // Min token amount
      0, // Min ETH amount
      this.signer.address, // LP token recipient
      deadline,
      { value: params.initialBaseAmount },
    );

    const receipt = await tx.wait();

    // Get factory to find the pair address
    const factoryAddress = this.getDexFactoryAddress();
    const factoryAbi = ['function getPair(address tokenA, address tokenB) view returns (address)'];
    const factory = new ethers.Contract(factoryAddress, factoryAbi, this.provider);
    
    const wethAddress = this.getWethAddress();
    const poolAddress = await factory.getPair(params.tokenAddress, wethAddress);

    this.logger.log(`Pool created at ${poolAddress}`);

    return {
      poolAddress,
      lpTokenAddress: poolAddress, // In Uniswap V2 style, the pair is also the LP token
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  }

  async getGasPrice(): Promise<bigint> {
    if (!this.provider) throw new Error('Provider not initialized');
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice ?? BigInt(0);
  }

  async sendTransaction(params: TransactionParams): Promise<TransactionResult> {
    if (!this.signer) throw new Error('Signer not initialized');

    const tx = await this.signer.sendTransaction({
      to: params.to,
      data: params.data,
      value: params.value,
      gasLimit: params.gasLimit,
    });

    return {
      hash: tx.hash,
      status: 'pending',
    };
  }

  async waitForTransaction(hash: string, confirmations = 1): Promise<TransactionResult> {
    if (!this.provider) throw new Error('Provider not initialized');

    const receipt = await this.provider.waitForTransaction(hash, confirmations);

    if (!receipt) {
      return { hash, status: 'pending' };
    }

    return {
      hash,
      blockNumber: receipt.blockNumber,
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      gasUsed: receipt.gasUsed,
    };
  }

  async getTransactionReceipt(hash: string): Promise<TransactionResult | null> {
    if (!this.provider) throw new Error('Provider not initialized');

    const receipt = await this.provider.getTransactionReceipt(hash);

    if (!receipt) return null;

    return {
      hash,
      blockNumber: receipt.blockNumber,
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      gasUsed: receipt.gasUsed,
    };
  }

  getExplorerTxUrl(hash: string): string {
    if (!this.config?.explorerUrl) return '';
    return `${this.config.explorerUrl}/tx/${hash}`;
  }

  getExplorerAddressUrl(address: string): string {
    if (!this.config?.explorerUrl) return '';
    return `${this.config.explorerUrl}/address/${address}`;
  }

  // ============== Protected helper methods ==============

  protected getTokenBytecode(params: DeployTokenParams): string {
    // This would be the actual compiled bytecode of the XfernoToken contract
    // For now, return a placeholder - actual bytecode should be loaded from artifacts
    return '0x';
  }

  protected getFactoryAddress(): string {
    // Get contract address based on network
    const addresses: Record<string, string> = {
      ETH_SEPOLIA: '0x822f72301756D054d3F3F4834F1c0A1A03A95716',
      // Add other networks as they are deployed
    };
    return addresses[this.networkId] || '';
  }

  protected getFactoryAbi(): string[] {
    return [
      'function createToken(string name, string symbol, uint256 totalSupply, address owner) returns (address)',
      'event TokenCreated(address indexed tokenAddress, string name, string symbol, address indexed creator)',
    ];
  }

  protected getRouterAddress(): string {
    const addresses: Record<string, string> = {
      ETH_SEPOLIA: '0xEDa7b0a02c994615909A62c318227673d3C9BC3a',
    };
    return addresses[this.networkId] || '';
  }

  protected getRouterAbi(): string[] {
    return [
      'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)',
    ];
  }

  protected getDexFactoryAddress(): string {
    const addresses: Record<string, string> = {
      ETH_SEPOLIA: '0xa4AaeB962Bc1f8485086b0c88E7f4070c9177329',
    };
    return addresses[this.networkId] || '';
  }

  protected getWethAddress(): string {
    const addresses: Record<string, string> = {
      ETH_SEPOLIA: '0x9F5BC37D202ac19876c39bBfaF8f4bC8bBD223FA',
    };
    return addresses[this.networkId] || '';
  }
}

/**
 * Ethereum-specific adapter
 */
export class EthereumAdapter extends EVMAdapter {
  constructor(networkId: string = 'ETH_MAINNET', chainId: number = 1) {
    super(networkId, chainId);
  }
}

/**
 * BDAG-specific adapter
 */
export class BDAGAdapter extends EVMAdapter {
  constructor(networkId: string = 'BDAG_MAINNET', chainId: number = 1337) {
    super(networkId, chainId);
  }

  // Override methods if BDAG has specific requirements
}

/**
 * Arbitrum-specific adapter
 */
export class ArbitrumAdapter extends EVMAdapter {
  constructor(networkId: string = 'ARBITRUM_ONE', chainId: number = 42161) {
    super(networkId, chainId);
  }
}

/**
 * Base-specific adapter
 */
export class BaseAdapter extends EVMAdapter {
  constructor(networkId: string = 'BASE_MAINNET', chainId: number = 8453) {
    super(networkId, chainId);
  }
}
