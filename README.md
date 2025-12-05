# 🔥 XFERNO

> **Launch here, graduate to the multiverse.**

XFERNO is a professional-grade, multi-chain token launchpad and decentralized exchange (DEX) platform.

## ✨ Features

- **Four Token Launch Modes**
  - ZKP Single-Chain Token
  - ZKP Split Token (Multi-chain)
  - L1 Single-Chain Token
  - L1 Split Token (Multi-chain)

- **Graduation Model** — Tokens start as pre-market assets and automatically graduate to live multi-chain deployments when funding targets are met.

- **Multi-Chain Support**
  - Base Networks: Ethereum, BlockDAG (BDAG)
  - Split Networks: Arbitrum, Base, BNB Chain, Polygon, Avalanche, Solana, and more

- **ZK Rollup Integration** — Fast, cheap, privacy-preserving trades with ZK-backed security.

## 🏗️ Project Structure

```
xferno/
├── apps/
│   ├── web/                 # Next.js 14 frontend
│   ├── api/                 # NestJS backend
│   ├── extension/           # Browser extension (.XFERNO resolver)
│   └── pwa/                 # Progressive Web App
│
├── packages/
│   ├── contracts/           # Smart contracts (Foundry)
│   ├── sdk/                 # JavaScript SDK
│   ├── types/               # Shared TypeScript types
│   ├── network-adapters/    # Chain-specific adapters
│   └── ui/                  # Shared UI components
│
├── infra/
│   ├── docker/              # Docker configurations
│   ├── k8s/                 # Kubernetes configs
│   └── terraform/           # Infrastructure as code
│
└── docs/                    # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker & Docker Compose
- Git

### Option 1: Full Docker Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/OG-XFERNO/XFERNO.git
cd XFERNO

# Copy environment file
cp .env.docker .env

# Start everything with Docker Compose
pnpm docker:up

# View logs
pnpm docker:logs
```

That's it! All services start automatically.

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/OG-XFERNO/XFERNO.git
cd XFERNO

# Install dependencies
pnpm install

# Copy environment file
cp .env.docker .env

# Start database services only
pnpm docker:db

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

### Development URLs

| Service | URL |
|---------|-----|
| **Web App** | http://localhost:3000 |
| **API** | http://localhost:3002 |
| **GraphQL Playground** | http://localhost:3002/graphql |
| **Health Check** | http://localhost:3002/health |

## 📦 Scripts

### Development
| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint all code |
| `pnpm test` | Run all tests |
| `pnpm typecheck` | Type-check all packages |

### Docker Commands
| Script | Description |
|--------|-------------|
| `pnpm docker:up` | Start all services (builds if needed) |
| `pnpm docker:down` | Stop all services |
| `pnpm docker:restart` | Restart all services |
| `pnpm docker:logs` | Follow all logs |
| `pnpm docker:logs:api` | Follow API logs only |
| `pnpm docker:logs:web` | Follow Web logs only |
| `pnpm docker:ps` | Show running containers |
| `pnpm docker:clean` | Stop and remove all containers, volumes, images |
| `pnpm docker:db` | Start only database services (PostgreSQL + Redis) |
| `pnpm docker:prod:up` | Start production environment |

### Docker Compose Direct Commands

```bash
# Start with live logs (attached mode)
docker compose up

# Start in background (detached)
docker compose up -d

# View live logs (for detached containers)
docker compose logs -f

# View specific service logs
docker compose logs -f api
docker compose logs -f web

# Restart all services
docker compose restart

# Stop all services
docker compose down

# Full reset (wipe database & volumes)
docker compose down -v
docker compose up -d
pnpm db:push
```

### Database Commands
| Script | Description |
|--------|-------------|
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:studio` | Open Prisma Studio GUI |
| `pnpm db:seed` | Seed the database |

## 🔧 Tech Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- TailwindCSS v4
- shadcn/ui
- wagmi / viem

### Backend
- NestJS
- PostgreSQL
- Prisma ORM
- Redis
- GraphQL (Apollo)

### Blockchain
- Foundry (Smart Contracts)
- Circom (ZK Circuits)
- ethers.js / viem
- @solana/web3.js

### Infrastructure
- Docker
- Turborepo
- GitHub Actions
- Kubernetes (production)

## 📚 Documentation

- [Project Overview](./project_overview.md)
- [Phase Summary](./phase_summary.md)
- [API Documentation](./docs/api/)
- [Smart Contract Docs](./docs/contracts/)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

Built with 🔥 by the XFERNO Team
