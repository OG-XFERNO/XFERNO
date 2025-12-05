# XFERNO Project Overview

> **Last Updated:** 2024-12-04  
> **Status:** 📋 PLANNING PHASE  
> **Current Phase:** Phase 0 (Not Started)  
> **Build Progress:** 0%

---

## 📌 Quick Status Dashboard

| Category | Status | Details |
|----------|--------|---------|
| **Planning Docs** | 🟡 In Progress | project_overview.md, phase_summary.md |
| **Infrastructure** | ⬜ Not Started | Monorepo, Docker, CI/CD |
| **Smart Contracts** | ⬜ Not Started | ZKR, Tokens, Bridges, DEX |
| **Backend API** | ⬜ Not Started | NestJS, PostgreSQL, Redis |
| **Frontend** | ⬜ Not Started | Next.js 14, TailwindCSS v4 |
| **PWA** | ⬜ Not Started | Mobile-first experience |
| **Browser Extension** | ⬜ Not Started | .XFERNO resolver |
| **Graduation Engine** | ⬜ Not Started | Multi-chain deployment |

---

## 1. Executive Summary

### 1.1 What is XFERNO?

**XFERNO** is a professional-grade, multi-chain token launchpad and decentralized exchange (DEX) platform. Think "pump.fun, but professional and multi-chain."

**Core Value Proposition:**
- **Launch Here, Graduate to the Multiverse** — Tokens start as pre-market assets on XFERNO and automatically graduate to live multi-chain deployments when funding targets are met.
- **Four Token Launch Modes** — Supporting both ZK-rollup integrated and standard L1 tokens, in single-chain or multi-chain split configurations.
- **Automated Graduation** — The platform handles gas payments, contract deployments, bridge setup, and DEX pool creation across all selected networks.

### 1.2 Target Networks

#### Base Networks (Canonical Token Home)
| Network | Type | Status |
|---------|------|--------|
| Ethereum Mainnet | EVM | Primary |
| BlockDAG (BDAG) | EVM-Compatible | Primary |

#### Split Networks (Multi-Chain Expansion)
| Network | Type | Priority |
|---------|------|----------|
| Arbitrum One | EVM L2 | Wave 1 |
| Base | EVM L2 | Wave 1 |
| BNB Chain | EVM | Wave 1 |
| Polygon PoS | EVM | Wave 1 |
| Avalanche C-Chain | EVM | Wave 1 |
| Solana | Non-EVM (SPL) | Wave 1 |
| zkSync Era | EVM L2 | Wave 2 |
| Linea | EVM L2 | Wave 2 |
| Scroll | EVM L2 | Wave 2 |
| Sui | Non-EVM (Move) | Wave 3 |
| Aptos | Non-EVM (Move) | Wave 3 |
| Near | Non-EVM | Wave 3 |
| Tron | Non-EVM | Wave 3 |

---

## 2. Four Token Launch Modes

### 2.1 Mode 1: ZKP Single-Chain Token
```
┌─────────────────────────────────────────────────────────┐
│  ZKP SINGLE-CHAIN TOKEN                                 │
├─────────────────────────────────────────────────────────┤
│  • Canonical on ONE base chain (ETH or BDAG)            │
│  • Integrated with XFERNO ZK Rollup (ZKR)               │
│  • Fast, cheap, ZK-backed trades                        │
│  • Privacy-preserving transactions                      │
│  • Single-chain liquidity concentration                 │
└─────────────────────────────────────────────────────────┘
```

**Use Cases:**
- Projects wanting maximum security and privacy
- Teams preferring concentrated liquidity
- Gas-sensitive applications

### 2.2 Mode 2: ZKP Split Token (Multi-Chain)
```
┌─────────────────────────────────────────────────────────┐
│  ZKP SPLIT TOKEN (MULTI-CHAIN)                          │
├─────────────────────────────────────────────────────────┤
│  • Canonical on base chain (ETH or BDAG)                │
│  • Creator selects 1+ split networks                    │
│  • ZKR enforces global supply invariants                │
│  • ZK portals coordinate cross-chain bridging           │
│  • Privacy + multi-chain reach                          │
└─────────────────────────────────────────────────────────┘
```

**Architecture:**
```
                    ┌─────────────┐
                    │    ZKR      │
                    │  (Supply    │
                    │  Enforcer)  │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │  Base Chain │ │  Split #1   │ │  Split #N   │
    │  (ETH/BDAG) │ │  (Arb/Base) │ │  (Solana)   │
    │  Canonical  │ │  ZK Portal  │ │  Adapter    │
    └─────────────┘ └─────────────┘ └─────────────┘
```

### 2.3 Mode 3: L1 Single-Chain Token (No ZK)
```
┌─────────────────────────────────────────────────────────┐
│  L1 SINGLE-CHAIN TOKEN                                  │
├─────────────────────────────────────────────────────────┤
│  • Standard L1 token deployment                         │
│  • ERC-20 on ETH/BDAG or SPL on Solana                  │
│  • No rollup integration in MVP                         │
│  • Traditional DEX trading                              │
│  • Simplest launch option                               │
└─────────────────────────────────────────────────────────┘
```

**Use Cases:**
- Simple token launches
- Teams wanting standard tooling compatibility
- Maximum composability with existing DeFi

### 2.4 Mode 4: L1 Split Token (Multi-Chain, No ZK)
```
┌─────────────────────────────────────────────────────────┐
│  L1 SPLIT TOKEN (MULTI-CHAIN)                           │
├─────────────────────────────────────────────────────────┤
│  • Canonical on base chain (ETH or BDAG)                │
│  • Mirrors on multiple split networks                   │
│  • L1 bridge contracts enforce global supply            │
│  • Hub-and-spoke or pair-wise bridging                  │
│  • No ZK overhead, full multi-chain reach               │
└─────────────────────────────────────────────────────────┘
```

**Architecture:**
```
                    ┌─────────────┐
                    │  Base Chain │
                    │    (HUB)    │
                    │  ETH/BDAG   │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
 ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
 │   Bridge    │    │   Bridge    │    │   Bridge    │
 │   Spoke 1   │    │   Spoke 2   │    │   Spoke N   │
 │  (Arbitrum) │    │   (Base)    │    │  (Solana)   │
 └─────────────┘    └─────────────┘    └─────────────┘
```

---

## 3. Graduation Model — The Core Innovation

### 3.1 Graduation Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TOKEN GRADUATION LIFECYCLE                           │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────────┐
  │  DRAFT   │───▶│   PRESALE    │───▶│ GRADUATION  │───▶│  LIVE MULTICHAIN │
  │          │    │   ACTIVE     │    │  PENDING    │    │                  │
  └──────────┘    └──────────────┘    └─────────────┘    └──────────────────┘
       │                │                   │                    │
       │                │                   │                    │
       ▼                ▼                   ▼                    ▼
  Creator sets     Users buy via      Target reached,     Real contracts
  parameters,      bonding curve,     Graduation Engine   live on all
  networks,        liquidity          deploys contracts   selected chains,
  graduation       accumulates        + bridges + pools   DEX trading live
  target
```

### 3.2 Status States

| Status | Description | Actions Available |
|--------|-------------|-------------------|
| `DRAFT` | Token configuration in progress | Edit all parameters |
| `PRESALE_ACTIVE` | Pre-market trading active | Buy/sell virtual tokens |
| `GRADUATION_PENDING` | Target hit, awaiting deployment | None (automated) |
| `GRADUATED_DEPLOYING` | Contracts being deployed | None (automated) |
| `LIVE_MULTICHAIN` | Fully live across all networks | Real DEX trading |

### 3.3 Graduation Engine — Detailed Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GRADUATION ENGINE FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

1. TRIGGER CHECK
   │
   ├─▶ Monitor: raised_amount >= graduation_target
   │
   └─▶ Set status: GRADUATION_PENDING

2. COST CALCULATION
   │
   ├─▶ For each network (base + splits):
   │   ├── Query gas prices
   │   ├── Estimate deployment costs
   │   ├── Calculate LP seeding requirements
   │   └── Sum total required liquidity
   │
   └─▶ Validate: total_cost <= available_liquidity

3. DEPLOYMENT SEQUENCE
   │
   ├─▶ BASE CHAIN:
   │   ├── Deploy canonical token contract
   │   ├── Deploy DEX pool (Uniswap/SushiSwap fork)
   │   ├── Seed initial liquidity
   │   └── Verify contract on explorer
   │
   ├─▶ FOR EACH SPLIT NETWORK (parallel where possible):
   │   ├── Deploy mirror/wrapped token
   │   ├── Deploy bridge contract (ZK Portal or L1 Bridge)
   │   ├── Deploy DEX pool
   │   ├── Seed initial liquidity
   │   ├── Configure bridge parameters
   │   └── Verify contracts
   │
   └─▶ ZK MODES ONLY:
       ├── Register token in ZKR
       ├── Map virtual balances → on-chain
       └── Configure portal connections

4. FINALIZATION
   │
   ├─▶ Update token status: LIVE_MULTICHAIN
   ├─▶ Transfer remaining liquidity to project treasury
   ├─▶ Emit graduation events
   ├─▶ Notify creator + community
   └─▶ Enable real DEX trading in UI
```

### 3.4 Presale / Pre-Market Mechanics

**Bonding Curve Configuration:**
```typescript
interface BondingCurveConfig {
  type: 'linear' | 'exponential' | 'sigmoid' | 'custom';
  initialPrice: bigint;           // Starting price in base asset
  priceMultiplier: number;        // Growth factor
  maxSupplyInPresale: bigint;     // Max tokens available pre-graduation
  reserveRatio: number;           // % of deposits held in reserve (0-100)
  graduationTarget: bigint;       // Liquidity target to trigger graduation
  baseAsset: 'ETH' | 'BDAG' | 'USDC';
}
```

**Virtual Token Balances:**
- For ZK modes: ZKR maintains virtual balances
- For L1 modes: Backend tracks IOUs, represented in rollup for UI
- All balances convert to real tokens at graduation

---

## 4. Technical Architecture

### 4.1 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           XFERNO ARCHITECTURE                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                                  │
├──────────────┬──────────────┬──────────────┬──────────────────────────────────┤
│   Next.js    │     PWA      │   Browser    │         Mobile Apps              │
│   Web App    │   (Mobile)   │  Extension   │      (Future: Native)            │
│              │              │  .XFERNO     │                                  │
└──────┬───────┴──────┬───────┴──────┬───────┴──────────────┬───────────────────┘
       │              │              │                      │
       └──────────────┴──────────────┴──────────────────────┘
                                    │
                           ┌────────▼────────┐
                           │   API Gateway   │
                           │    (GraphQL)    │
                           └────────┬────────┘
                                    │
┌───────────────────────────────────┴──────────────────────────────────────────┐
│                              BACKEND LAYER                                   │
├──────────────┬──────────────┬──────────────┬──────────────┬──────────────────┤
│   Auth       │   Launch     │  Graduation  │   Trading    │   Analytics      │
│   Service    │   Service    │   Engine     │   Service    │   Service        │
│              │              │              │              │                  │
│  • DIDit     │  • Wizard    │  • Deploy    │  • Router    │  • Indexers      │
│  • 2FA       │  • Presale   │  • Bridge    │  • DEX Agg   │  • Metrics       │
│  • KYC       │  • Config    │  • Pool Seed │  • Orders    │  • Charts        │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────────┘
       │              │              │              │              │
       └──────────────┴──────────────┴──────────────┴──────────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     │                             │
              ┌──────▼──────┐              ┌───────▼───────┐
              │  PostgreSQL │              │     Redis     │
              │  (Primary)  │              │   (Cache/Q)   │
              └─────────────┘              └───────────────┘
                                    │
┌───────────────────────────────────┴──────────────────────────────────────────┐
│                           BLOCKCHAIN LAYER                                   │
├──────────────┬──────────────┬──────────────┬──────────────┬──────────────────┤
│     ZKR      │   Network    │   Bridge     │    DEX       │   Indexer        │
│   (Rollup)   │   Adapters   │  Contracts   │  Contracts   │   Nodes          │
│              │              │              │              │                  │
│  • Circuits  │  • EVM       │  • ZK Portal │  • Pools     │  • The Graph     │
│  • Prover    │  • Solana    │  • L1 Bridge │  • Router    │  • Custom        │
│  • State     │  • Future    │  • Relayers  │  • Factory   │                  │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────────┘
```

### 4.2 Monorepo Structure

```
xferno/
├── apps/
│   ├── web/                    # Next.js 14 frontend
│   │   ├── app/                # App router pages
│   │   ├── components/         # React components
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # Utilities
│   │   └── styles/             # TailwindCSS v4
│   │
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/       # Authentication
│   │   │   │   ├── launch/     # Token launch
│   │   │   │   ├── trading/    # DEX trading
│   │   │   │   ├── graduation/ # Graduation engine
│   │   │   │   ├── bridge/     # Bridge operations
│   │   │   │   └── admin/      # Admin panel
│   │   │   ├── common/         # Shared utilities
│   │   │   └── config/         # Configuration
│   │   └── prisma/             # Database schema
│   │
│   ├── extension/              # Browser extension
│   │   ├── manifest.json
│   │   ├── background/
│   │   ├── content/
│   │   └── popup/
│   │
│   └── pwa/                    # Progressive Web App
│       └── ...
│
├── packages/
│   ├── contracts/              # Smart contracts
│   │   ├── src/
│   │   │   ├── tokens/         # Token factories
│   │   │   ├── bridges/        # Bridge contracts
│   │   │   ├── dex/            # DEX contracts
│   │   │   ├── zkr/            # ZK Rollup
│   │   │   └── presale/        # Presale contracts
│   │   ├── deploy/             # Deployment scripts
│   │   └── test/               # Contract tests
│   │
│   ├── sdk/                    # JavaScript SDK
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── tokens.ts
│   │   │   ├── trading.ts
│   │   │   └── bridge.ts
│   │   └── package.json
│   │
│   ├── types/                  # Shared TypeScript types
│   │   └── src/
│   │       ├── token.ts
│   │       ├── network.ts
│   │       └── graduation.ts
│   │
│   ├── network-adapters/       # Chain-specific adapters
│   │   ├── src/
│   │   │   ├── base/           # Abstract adapter
│   │   │   ├── evm/            # EVM adapter
│   │   │   ├── solana/         # Solana adapter
│   │   │   └── registry.ts     # Adapter registry
│   │   └── package.json
│   │
│   └── ui/                     # Shared UI components
│       ├── src/
│       │   ├── primitives/
│       │   └── composed/
│       └── package.json
│
├── infra/
│   ├── docker/
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.web
│   │   └── docker-compose.yml
│   ├── k8s/                    # Kubernetes configs
│   └── terraform/              # Infrastructure as code
│
├── docs/
│   ├── api/                    # API documentation
│   ├── contracts/              # Contract docs
│   └── guides/                 # User guides
│
├── scripts/
│   ├── deploy/                 # Deployment scripts
│   └── dev/                    # Development utilities
│
├── project_overview.md         # This file
├── phase_summary.md            # Phase tracking
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml         # PNPM workspaces
├── .env.example
└── README.md
```

### 4.3 Database Schema (Core Tables)

```sql
-- Networks Registry
CREATE TABLE networks (
  id                    UUID PRIMARY KEY,
  name                  VARCHAR(50) NOT NULL,      -- 'Ethereum Mainnet'
  chain_id              INTEGER,                   -- 1, 42161, etc.
  type                  VARCHAR(20) NOT NULL,      -- 'EVM', 'SOLANA', 'MOVE'
  symbol                VARCHAR(10) NOT NULL,      -- 'ETH', 'SOL'
  rpc_url               TEXT NOT NULL,
  ws_url                TEXT,
  explorer_url          TEXT,
  token_standard        VARCHAR(20) NOT NULL,      -- 'ERC20', 'SPL', 'MOVE'
  is_enabled_for_base   BOOLEAN DEFAULT false,
  is_enabled_for_split  BOOLEAN DEFAULT false,
  gas_token             VARCHAR(10),
  avg_block_time_ms     INTEGER,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

-- Tokens
CREATE TABLE tokens (
  id                    UUID PRIMARY KEY,
  name                  VARCHAR(100) NOT NULL,
  symbol                VARCHAR(20) NOT NULL,
  description           TEXT,
  image_url             TEXT,
  
  -- Launch configuration
  launch_mode           VARCHAR(30) NOT NULL,      -- 'zk_single_chain', 'zk_split_multichain', 'l1_single_chain', 'l1_split_multichain'
  base_chain_id         UUID REFERENCES networks(id),
  split_network_ids     UUID[] DEFAULT '{}',       -- Array of network IDs
  
  -- Supply & economics
  total_supply          NUMERIC(78,0) NOT NULL,
  decimals              INTEGER DEFAULT 18,
  
  -- Graduation
  graduation_target     NUMERIC(78,0) NOT NULL,    -- Amount in base asset wei
  graduation_asset      VARCHAR(20) DEFAULT 'ETH', -- 'ETH', 'BDAG', 'USDC'
  raised_amount         NUMERIC(78,0) DEFAULT 0,
  
  -- Bonding curve
  bonding_curve_type    VARCHAR(20) DEFAULT 'exponential',
  initial_price         NUMERIC(78,0),
  price_multiplier      NUMERIC(10,6),
  max_presale_supply    NUMERIC(78,0),
  
  -- Status
  status                VARCHAR(30) DEFAULT 'DRAFT',
  
  -- Ownership
  creator_id            UUID REFERENCES users(id),
  creator_multisig      TEXT,                      -- Multisig address if set
  
  -- Timestamps
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW(),
  graduated_at          TIMESTAMP,
  
  CONSTRAINT valid_launch_mode CHECK (
    launch_mode IN ('zk_single_chain', 'zk_split_multichain', 'l1_single_chain', 'l1_split_multichain')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('DRAFT', 'PRESALE_ACTIVE', 'GRADUATION_PENDING', 'GRADUATED_DEPLOYING', 'LIVE_MULTICHAIN')
  )
);

-- Token Deployments (per network)
CREATE TABLE token_deployments (
  id                    UUID PRIMARY KEY,
  token_id              UUID REFERENCES tokens(id),
  network_id            UUID REFERENCES networks(id),
  
  -- Contract addresses
  token_address         TEXT,
  bridge_address        TEXT,
  pool_address          TEXT,
  
  -- Deployment status
  deployment_status     VARCHAR(20) DEFAULT 'PENDING',
  deployment_tx_hash    TEXT,
  verified              BOOLEAN DEFAULT false,
  
  -- Timestamps
  deployed_at           TIMESTAMP,
  created_at            TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(token_id, network_id)
);

-- Presale Contributions
CREATE TABLE presale_contributions (
  id                    UUID PRIMARY KEY,
  token_id              UUID REFERENCES tokens(id),
  user_id               UUID REFERENCES users(id),
  
  amount                NUMERIC(78,0) NOT NULL,    -- Base asset amount
  tokens_received       NUMERIC(78,0) NOT NULL,    -- Virtual tokens
  price_at_purchase     NUMERIC(78,0) NOT NULL,
  
  tx_hash               TEXT,
  network_id            UUID REFERENCES networks(id),
  
  created_at            TIMESTAMP DEFAULT NOW()
);

-- Graduation Logs
CREATE TABLE graduation_logs (
  id                    UUID PRIMARY KEY,
  token_id              UUID REFERENCES tokens(id),
  
  total_raised          NUMERIC(78,0),
  gas_spent             NUMERIC(78,0),
  lp_seeded             NUMERIC(78,0),
  treasury_remainder    NUMERIC(78,0),
  
  started_at            TIMESTAMP,
  completed_at          TIMESTAMP,
  status                VARCHAR(20),
  error_message         TEXT,
  
  created_at            TIMESTAMP DEFAULT NOW()
);
```

### 4.4 Network Adapter Interface

```typescript
// packages/network-adapters/src/base/adapter.interface.ts

interface NetworkAdapter {
  // Identity
  readonly networkId: string;
  readonly networkType: 'EVM' | 'SOLANA' | 'MOVE' | 'OTHER';
  readonly chainId?: number;

  // Connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Token Operations
  deployToken(params: DeployTokenParams): Promise<DeploymentResult>;
  getTokenInfo(address: string): Promise<TokenInfo>;
  
  // Bridge Operations
  deployBridge(params: DeployBridgeParams): Promise<DeploymentResult>;
  bridgeTokens(params: BridgeParams): Promise<TransactionResult>;
  
  // DEX Operations
  deployDexPool(params: DeployPoolParams): Promise<DeploymentResult>;
  addLiquidity(params: AddLiquidityParams): Promise<TransactionResult>;
  getPoolInfo(poolAddress: string): Promise<PoolInfo>;
  
  // Gas & Costs
  estimateGasCosts(operations: Operation[]): Promise<GasEstimate>;
  getGasPrice(): Promise<bigint>;
  
  // Transactions
  sendTransaction(tx: TransactionRequest): Promise<TransactionResult>;
  waitForTransaction(txHash: string): Promise<TransactionReceipt>;
  
  // Queries
  getBalance(address: string, tokenAddress?: string): Promise<bigint>;
  getBlockNumber(): Promise<number>;
}

interface DeployTokenParams {
  name: string;
  symbol: string;
  totalSupply: bigint;
  decimals: number;
  owner: string;
  initialHolders?: { address: string; amount: bigint }[];
}

interface DeployBridgeParams {
  tokenAddress: string;
  bridgeType: 'ZK_PORTAL' | 'L1_BRIDGE';
  remoteChainId: number;
  remoteTokenAddress?: string;
}

interface DeployPoolParams {
  token0: string;
  token1: string;
  fee: number;
  initialPrice: bigint;
  liquidity: { token0Amount: bigint; token1Amount: bigint };
}
```

---

## 5. Feature Specifications

### 5.1 Launch Wizard — Complete Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LAUNCH WIZARD FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: TOKEN BASICS
├── Name (required, 3-50 chars)
├── Symbol (required, 2-10 chars, uppercase)
├── Description (optional, max 1000 chars)
├── Logo upload (PNG/SVG, max 2MB)
├── Total Supply (required, 1 - 10^18)
└── Decimals (default 18, range 0-18)

STEP 2: LAUNCH MODE
├── ○ ZKP Single-Chain
│   └── "Maximum privacy, single network, ZK-backed trades"
├── ○ ZKP Split (Multi-Chain)
│   └── "Privacy + presence on multiple networks"
├── ○ L1 Single-Chain
│   └── "Standard token, single network, no ZK overhead"
└── ○ L1 Split (Multi-Chain)
    └── "Standard token across multiple networks"

STEP 3: NETWORK SELECTION
├── BASE NETWORK (required)
│   ├── ○ Ethereum
│   └── ○ BlockDAG (BDAG)
│
└── SPLIT NETWORKS (if split mode selected)
    ├── ☐ Arbitrum One
    ├── ☐ Base
    ├── ☐ BNB Chain
    ├── ☐ Polygon PoS
    ├── ☐ Avalanche C-Chain
    ├── ☐ Solana
    └── [More coming soon...]
    
    Validation: At least 1 split network required
    Validation: Base network cannot be in split networks

STEP 4: GRADUATION CONFIGURATION
├── Graduation Target
│   ├── Amount: [________] (min 0.1 ETH equivalent)
│   └── Asset: ○ ETH  ○ BDAG  ○ USDC
│
├── Bonding Curve
│   ├── Type: ○ Linear  ○ Exponential  ○ Sigmoid
│   ├── Initial Price: [________]
│   ├── Growth Rate: [________]
│   └── Max Presale Supply: [________] (% of total)
│
└── Advanced (collapsible)
    ├── Min LP per chain: [________]
    ├── Max slippage: [________]%
    └── Presale duration: [________] days (0 = unlimited)

STEP 5: GOVERNANCE (OPTIONAL)
├── Creator Multisig
│   ├── ○ No multisig (single owner)
│   └── ○ Enable multisig
│       ├── Signers: [Add addresses...]
│       └── Threshold: [__] of [__]
│
└── Token Governance (future)
    └── [Placeholder for governance token integration]

STEP 6: SOCIAL & LINKS
├── Website URL
├── Twitter/X handle
├── Discord invite
├── Telegram link
└── Custom links (up to 5)

STEP 7: REVIEW & LAUNCH
├── Summary card showing all selections
├── Estimated costs breakdown:
│   ├── Base chain deployment: ~X ETH
│   ├── Split network deployments: ~Y ETH total
│   ├── Bridge setup: ~Z ETH
│   ├── Initial LP (from graduation): configurable
│   └── TOTAL AT GRADUATION: ~W ETH
│
├── ☐ I agree to XFERNO Terms of Service
├── ☐ I understand the graduation process
│
└── [Launch Presale] button
```

### 5.2 Trading Interface

**Pre-Graduation (Presale Active):**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  $TOKEN — Pre-Market Trading                              [PRESALE ACTIVE]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────┐  ┌──────────────────────────────────┐  │
│  │        BONDING CURVE            │  │         BUY / SELL               │  │
│  │                                 │  │                                  │  │
│  │         ╭────────╮              │  │  [BUY]  [SELL]                   │  │
│  │        ╱          ╲             │  │                                  │  │
│  │       ╱            ╲            │  │  Amount: [__________] ETH        │  │
│  │      ╱              ● current   │  │                                  │  │
│  │     ╱                           │  │  You receive: ~XXX,XXX $TOKEN    │  │
│  │    ╱                            │  │  Price impact: 0.5%              │  │
│  │   ●                             │  │                                  │  │
│  │  start                          │  │  [Connect Wallet]                │  │
│  └─────────────────────────────────┘  └──────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  GRADUATION PROGRESS                                                    ││
│  │  ████████████████████████░░░░░░░░░░░░  65% (6.5 / 10 ETH)              ││
│  │                                                                         ││
│  │  Target: 10 ETH  •  Raised: 6.5 ETH  •  Participants: 234              ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  TOKEN INFO                                                             ││
│  │                                                                         ││
│  │  Mode: ZKP Split (Multi-Chain)                                         ││
│  │  Base: Ethereum  •  Splits: Arbitrum, Base, Solana                     ││
│  │  Supply: 1,000,000,000  •  Presale Supply: 500,000,000 (50%)           ││
│  │  Current Price: 0.000013 ETH  •  Market Cap: $32,500                   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

**Post-Graduation (Live Multi-Chain):**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  $TOKEN — Live Trading                                    [LIVE MULTICHAIN] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  NETWORK: [ETH ▼] [ARB] [BASE] [SOL]                                       │
│                                                                             │
│  ┌─────────────────────────────────┐  ┌──────────────────────────────────┐  │
│  │        PRICE CHART              │  │         SWAP                     │  │
│  │                                 │  │                                  │  │
│  │  [1H] [4H] [1D] [1W] [1M]      │  │  From: [ETH     ▼] [________]    │  │
│  │                                 │  │                       ↕          │  │
│  │     ╭──╮    ╭──────╮           │  │  To:   [$TOKEN  ▼] [________]    │  │
│  │  ───╯  ╰────╯      ╰───        │  │                                  │  │
│  │                                 │  │  Rate: 1 ETH = XXX $TOKEN        │  │
│  │  Price: $0.00032 (+15.2%)      │  │  Slippage: 0.5%                  │  │
│  │                                 │  │                                  │  │
│  └─────────────────────────────────┘  │  [Swap]                          │  │
│                                        └──────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  MULTI-CHAIN METRICS                                                    ││
│  │                                                                         ││
│  │  Network      Price       24h Vol     Liquidity    Holders             ││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │  Ethereum     $0.00032    $125K       $450K        1,234               ││
│  │  Arbitrum     $0.00031    $89K        $280K        892                 ││
│  │  Base         $0.00033    $45K        $120K        456                 ││
│  │  Solana       $0.00032    $67K        $200K        678                 ││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │  GLOBAL       $0.00032    $326K       $1.05M       3,260               ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Admin Panel Features

```
ADMIN PANEL SECTIONS:

1. DASHBOARD
   ├── Total tokens launched
   ├── Active presales
   ├── Pending graduations
   ├── Live tokens
   ├── Total liquidity locked
   ├── Protocol revenue
   └── Network health status

2. TOKEN MANAGEMENT
   ├── List all tokens (filterable by status)
   ├── View token details
   ├── Pause/unpause presale
   ├── Adjust graduation thresholds (emergency)
   ├── Force graduation (admin override)
   └── Blacklist token (extreme cases)

3. NETWORK MANAGEMENT
   ├── View all networks
   ├── Enable/disable networks for launch
   ├── Update RPC endpoints
   ├── View network health metrics
   └── Gas price monitoring

4. GRADUATION MONITORING
   ├── Queue of pending graduations
   ├── In-progress deployments
   ├── Deployment logs per token per network
   ├── Failed deployments (retry/investigate)
   └── Gas spending analytics

5. USER MANAGEMENT
   ├── User list with KYC status
   ├── Creator verification
   ├── Role management
   └── Suspension controls

6. PROTOCOL SETTINGS
   ├── Fee configuration
   ├── Graduation parameters
   ├── Supported networks
   ├── Bonding curve templates
   └── Feature flags

7. ANALYTICS
   ├── Volume charts
   ├── User growth
   ├── Network distribution
   ├── Revenue breakdown
   └── Export reports
```

---

## 6. Security Considerations

### 6.1 Smart Contract Security

| Layer | Security Measure |
|-------|------------------|
| Token Contracts | OpenZeppelin standards, reentrancy guards |
| Bridge Contracts | Time-locks, multisig controls, rate limits |
| Presale Contracts | Withdrawal limits, emergency pause |
| DEX Pools | Flash loan protection, price manipulation guards |
| ZK Circuits | Formal verification, audit required |

### 6.2 Backend Security

| Layer | Security Measure |
|-------|------------------|
| API | Rate limiting, input validation, SQL injection prevention |
| Auth | JWT with short expiry, refresh tokens, 2FA |
| Keys | Hardware security modules (HSM) for signing keys |
| Data | Encryption at rest, TLS 1.3 in transit |
| Admin | IP allowlisting, audit logs, principle of least privilege |

### 6.3 Graduation Engine Security

- **Multisig deployment wallets** — No single key can deploy contracts
- **Gas price limits** — Prevent excessive spending during high gas periods
- **Deployment verification** — All contracts verified on explorers
- **Rollback capability** — Failed partial deployments can be cleaned up
- **Audit trail** — All graduation actions logged immutably

---

## 7. Development Phases Overview

| Phase | Name | Key Deliverables | Duration |
|-------|------|------------------|----------|
| **0** | Foundation | Monorepo, DB schema, design system, infra | 2-3 weeks |
| **1** | ETH MVP | ZKR, 4 token modes, presale, graduation (ETH only) | 4-6 weeks |
| **2** | Auth & Social | DIDit, KYC, 2FA, social features, staging | 3-4 weeks |
| **3** | BDAG + Adapters | BDAG integration, network adapters, multisigs | 4-5 weeks |
| **4** | Full Multi-Chain | All EVM + Solana, post-hoc splits, protocol multisig | 5-6 weeks |
| **5** | Production | Automation, vaults, routing, hardening, launch | 4-5 weeks |

**Total Estimated Duration:** 22-29 weeks

---

## 8. Success Metrics

### 8.1 Launch KPIs

| Metric | Target (3 months post-launch) |
|--------|-------------------------------|
| Tokens launched | 500+ |
| Successful graduations | 100+ |
| Total liquidity raised | $5M+ |
| Active users | 10,000+ |
| Networks supported | 8+ |

### 8.2 Technical KPIs

| Metric | Target |
|--------|--------|
| API uptime | 99.9% |
| Graduation success rate | 99%+ |
| Average graduation time | < 10 minutes |
| Bridge transaction success | 99.5%+ |
| Page load time | < 2 seconds |

---

## 9. Open Questions & Decisions

| # | Question | Status | Decision |
|---|----------|--------|----------|
| 1 | Solana bridge approach — native or wormhole? | ⬜ Open | |
| 2 | ZK circuit complexity for multi-chain | ⬜ Open | |
| 3 | Fee structure per network | ⬜ Open | |
| 4 | Failed graduation refund policy | ⬜ Open | |
| 5 | Non-EVM ZK integration (Solana) | ⬜ Open | |

---

## 10. Reference Documents

| Document | Purpose |
|----------|---------|
| `phase_summary.md` | Single source of truth for phase tracking |
| `docs/api/` | API endpoint documentation |
| `docs/contracts/` | Smart contract specifications |
| `docs/guides/` | User and developer guides |

---

## 11. Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2024-12-04 | 1.0.0 | Initial project overview created |

---

> **Next Steps:** Review `phase_summary.md` for detailed phase breakdown and current progress tracking.
