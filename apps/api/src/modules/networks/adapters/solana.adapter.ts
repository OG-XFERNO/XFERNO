import { Logger } from '@nestjs/common';
import { NetworkType } from '@prisma/client';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getMint,
  getAccount,
} from '@solana/spl-token';
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

/**
 * Solana Network Adapter
 * Handles SPL token deployments on Solana
 */
export class SolanaAdapter implements INetworkAdapter {
  protected readonly logger = new Logger(SolanaAdapter.name);
  protected config: NetworkConfig | null = null;
  protected connection: Connection | null = null;
  protected wallet: Keypair | null = null;

  public readonly networkId: string;
  public readonly networkType: NetworkType = NetworkType.SOLANA;
  public readonly chainId: number | null = null;

  constructor(networkId: string = 'SOLANA_MAINNET') {
    this.networkId = networkId;
  }

  async initialize(config: NetworkConfig): Promise<void> {
    this.config = config;
    
    // Initialize Solana connection
    this.connection = new Connection(config.rpcUrl, 'confirmed');
    
    // Initialize wallet from environment variable
    const privateKeyEnv = process.env[`${this.networkId}_DEPLOYER_PRIVATE_KEY`];
    if (privateKeyEnv) {
      try {
        // Support both base58 and JSON array formats
        let secretKey: Uint8Array;
        if (privateKeyEnv.startsWith('[')) {
          secretKey = new Uint8Array(JSON.parse(privateKeyEnv));
        } else {
          // Base58 encoded - would need bs58 package
          // For now, assume JSON array format
          this.logger.warn('Base58 private key format not supported, use JSON array');
        }
        this.wallet = Keypair.fromSecretKey(secretKey);
        this.logger.log(`Wallet loaded: ${this.wallet.publicKey.toBase58()}`);
      } catch (err) {
        this.logger.warn(`Failed to load wallet: ${err}`);
      }
    }

    this.logger.log(`SolanaAdapter initialized for ${config.name}`);
  }

  async isConnected(): Promise<boolean> {
    if (!this.connection) return false;
    try {
      await this.connection.getLatestBlockhash();
      return true;
    } catch {
      return false;
    }
  }

  async getBalance(address: string): Promise<bigint> {
    if (!this.connection) throw new Error('Connection not initialized');
    const pubkey = new PublicKey(address);
    const balance = await this.connection.getBalance(pubkey);
    return BigInt(balance);
  }

  async getTokenBalance(tokenAddress: string, ownerAddress: string): Promise<bigint> {
    if (!this.connection) throw new Error('Connection not initialized');
    try {
      const mint = new PublicKey(tokenAddress);
      const owner = new PublicKey(ownerAddress);
      
      // Get associated token account
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.wallet!, // Payer
        mint,
        owner,
      );
      
      const accountInfo = await getAccount(this.connection, tokenAccount.address);
      return BigInt(accountInfo.amount.toString());
    } catch (err) {
      this.logger.warn(`Failed to get token balance: ${err}`);
      return BigInt(0);
    }
  }

  async estimateDeployToken(params: DeployTokenParams): Promise<GasEstimate> {
    // Solana uses lamports for transaction fees
    // Typical SPL token creation costs ~0.002 SOL
    const estimatedLamports = BigInt(2_000_000); // ~0.002 SOL
    
    return {
      gasLimit: estimatedLamports,
      gasPrice: BigInt(1),
      estimatedCost: estimatedLamports,
    };
  }

  async deployToken(params: DeployTokenParams): Promise<DeployTokenResult> {
    if (!this.connection || !this.wallet) {
      throw new Error('Solana connection or wallet not initialized');
    }

    this.logger.log(`Deploying SPL token: ${params.name} (${params.symbol})`);

    try {
      // 1. Create the mint (SPL token)
      const mint = await createMint(
        this.connection,
        this.wallet, // Payer
        this.wallet.publicKey, // Mint authority
        this.wallet.publicKey, // Freeze authority (can be null)
        params.decimals,
      );

      this.logger.log(`Mint created: ${mint.toBase58()}`);

      // 2. Create token account for owner and mint initial supply
      const ownerPubkey = new PublicKey(params.owner);
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.wallet,
        mint,
        ownerPubkey,
      );

      // 3. Mint initial supply to owner
      const mintTx = await mintTo(
        this.connection,
        this.wallet,
        mint,
        tokenAccount.address,
        this.wallet, // Mint authority
        params.totalSupply,
      );

      this.logger.log(`Initial supply minted: ${mintTx}`);

      // Note: Token metadata (name, symbol) requires Metaplex integration
      // For now, we just create the mint without on-chain metadata
      // TODO: Add Metaplex metadata creation for full token info

      return {
        tokenAddress: mint.toBase58(),
        transactionHash: mintTx,
        blockNumber: 0, // Solana doesn't use block numbers the same way
      };
    } catch (err) {
      this.logger.error(`Failed to deploy SPL token: ${err}`);
      throw err;
    }
  }

  async estimateDeployBridge(params: DeployBridgeParams): Promise<GasEstimate> {
    // Bridge deployment costs on Solana
    const estimatedLamports = BigInt(10_000_000); // ~0.01 SOL
    
    return {
      gasLimit: estimatedLamports,
      gasPrice: BigInt(1),
      estimatedCost: estimatedLamports,
    };
  }

  async deployBridge(params: DeployBridgeParams): Promise<DeployBridgeResult> {
    // TODO: Implement Wormhole or custom bridge deployment
    throw new Error('Solana bridge deployment not yet implemented');
  }

  async estimateDeployPool(params: DeployPoolParams): Promise<GasEstimate> {
    // Pool creation on Raydium/Orca costs
    const estimatedLamports = BigInt(5_000_000); // ~0.005 SOL
    
    return {
      gasLimit: estimatedLamports,
      gasPrice: BigInt(1),
      estimatedCost: estimatedLamports,
    };
  }

  async deployPool(params: DeployPoolParams): Promise<DeployPoolResult> {
    // TODO: Implement Raydium or Orca pool creation
    // 1. Create pool account
    // 2. Add initial liquidity
    // 3. Return pool address
    
    throw new Error('Solana pool deployment not yet implemented');
  }

  async getGasPrice(): Promise<bigint> {
    // Solana uses priority fees, not gas price
    // Return average priority fee in lamports
    return BigInt(1);
  }

  async sendTransaction(params: TransactionParams): Promise<TransactionResult> {
    // TODO: Implement Solana transaction sending
    throw new Error('Solana transactions not yet implemented');
  }

  async waitForTransaction(hash: string, confirmations = 1): Promise<TransactionResult> {
    // TODO: Implement transaction confirmation waiting
    // await this.connection.confirmTransaction(hash, 'confirmed');
    throw new Error('Solana transaction confirmation not yet implemented');
  }

  async getTransactionReceipt(hash: string): Promise<TransactionResult | null> {
    // TODO: Implement transaction receipt fetching
    throw new Error('Solana transaction receipt not yet implemented');
  }

  getExplorerTxUrl(hash: string): string {
    if (!this.config?.explorerUrl) return '';
    // Solscan format
    const cluster = this.networkId.includes('DEVNET') ? '?cluster=devnet' : '';
    return `${this.config.explorerUrl}/tx/${hash}${cluster}`;
  }

  getExplorerAddressUrl(address: string): string {
    if (!this.config?.explorerUrl) return '';
    const cluster = this.networkId.includes('DEVNET') ? '?cluster=devnet' : '';
    return `${this.config.explorerUrl}/account/${address}${cluster}`;
  }
}

export default SolanaAdapter;
