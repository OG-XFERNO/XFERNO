-- XFERNO Seed Data
-- Run with: docker compose exec -T postgres psql -U postgres -d xferno < seed_data.sql

-- =====================================================
-- PRIMARY SUPER ADMIN
-- =====================================================

-- Create or update primary super admin user
INSERT INTO "User" (
  id, 
  email, 
  username, 
  "displayName", 
  role, 
  "accountType", 
  "emailVerified", 
  "kycStatus",
  "createdAt", 
  "updatedAt"
)
VALUES (
  'primary-admin-001',
  'shawn.wilson@xferno.pro',
  'shawn',
  'Shawn Wilson',
  'SUPER_ADMIN',
  'CREATOR',
  true,
  'VERIFIED',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET 
  role = 'SUPER_ADMIN',
  "accountType" = 'CREATOR',
  "emailVerified" = true,
  "kycStatus" = 'VERIFIED',
  "updatedAt" = NOW();

-- Create admin invitation record for primary admin (for staff badge)
INSERT INTO "AdminInvitation" (
  id,
  email,
  role,
  token,
  "expiresAt",
  "acceptedAt",
  "acceptedById",
  "createdAt"
)
VALUES (
  'primary-admin-invite-001',
  'shawn.wilson@xferno.pro',
  'SUPER_ADMIN',
  'primary-admin-token-not-for-use',
  NOW() + INTERVAL '100 years',
  NOW(),
  'primary-admin-001',
  NOW()
)
ON CONFLICT (email) DO UPDATE SET 
  role = 'SUPER_ADMIN',
  "acceptedAt" = NOW();

-- =====================================================
-- NETWORKS (Required for token creation)
-- =====================================================

-- Sepolia Testnet
INSERT INTO "Network" (
  id,
  name,
  "chainId",
  type,
  symbol,
  "tokenStandard",
  "rpcUrl",
  "explorerUrl",
  "isEnabledForBase",
  "isEnabledForSplit",
  "createdAt",
  "updatedAt"
)
VALUES (
  'network-sepolia',
  'Sepolia',
  11155111,
  'EVM',
  'ETH',
  'ERC20',
  'https://rpc.sepolia.org',
  'https://sepolia.etherscan.io',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  "rpcUrl" = 'https://rpc.sepolia.org',
  "isEnabledForBase" = true,
  "isEnabledForSplit" = true,
  "updatedAt" = NOW();

-- Base Sepolia Testnet
INSERT INTO "Network" (
  id,
  name,
  "chainId",
  type,
  symbol,
  "tokenStandard",
  "rpcUrl",
  "explorerUrl",
  "isEnabledForBase",
  "isEnabledForSplit",
  "createdAt",
  "updatedAt"
)
VALUES (
  'network-base-sepolia',
  'Base Sepolia',
  84532,
  'EVM',
  'ETH',
  'ERC20',
  'https://sepolia.base.org',
  'https://sepolia.basescan.org',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  "isEnabledForBase" = true,
  "isEnabledForSplit" = true,
  "updatedAt" = NOW();

-- Ethereum Mainnet (disabled for now)
INSERT INTO "Network" (
  id,
  name,
  "chainId",
  type,
  symbol,
  "tokenStandard",
  "rpcUrl",
  "explorerUrl",
  "isEnabledForBase",
  "isEnabledForSplit",
  "createdAt",
  "updatedAt"
)
VALUES (
  'network-ethereum',
  'Ethereum',
  1,
  'EVM',
  'ETH',
  'ERC20',
  'https://eth.llamarpc.com',
  'https://etherscan.io',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  "isEnabledForBase" = false,
  "isEnabledForSplit" = false,
  "updatedAt" = NOW();

-- =====================================================
-- ADMIN LOG (Initial entry)
-- =====================================================

INSERT INTO "AdminLog" (
  id,
  "adminId",
  action,
  "targetType",
  "targetId",
  details,
  "createdAt"
)
VALUES (
  gen_random_uuid(),
  'primary-admin-001',
  'SYSTEM_SEED',
  'SYSTEM',
  'database',
  '{"action": "Database seeded with initial admin and networks"}',
  NOW()
);

-- =====================================================
-- OUTPUT
-- =====================================================

SELECT 'Seed completed!' AS status;
SELECT email, role, "displayName" FROM "User" WHERE role IN ('ADMIN', 'SUPER_ADMIN');
SELECT name, "chainId", "isEnabledForBase" AS enabled FROM "Network";