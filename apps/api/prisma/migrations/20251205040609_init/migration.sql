-- CreateEnum
CREATE TYPE "NetworkType" AS ENUM ('EVM', 'SOLANA', 'MOVE', 'OTHER');

-- CreateEnum
CREATE TYPE "TokenStandard" AS ENUM ('ERC20', 'SPL', 'MOVE');

-- CreateEnum
CREATE TYPE "LaunchMode" AS ENUM ('ZK_SINGLE_CHAIN', 'ZK_SPLIT_MULTICHAIN', 'L1_SINGLE_CHAIN', 'L1_SPLIT_MULTICHAIN');

-- CreateEnum
CREATE TYPE "TokenStatus" AS ENUM ('DRAFT', 'PRESALE_ACTIVE', 'GRADUATION_PENDING', 'GRADUATED_DEPLOYING', 'LIVE_MULTICHAIN', 'PAUSED', 'FAILED');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('PENDING', 'DEPLOYING', 'DEPLOYED', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "BondingCurveType" AS ENUM ('LINEAR', 'EXPONENTIAL', 'SIGMOID', 'CUSTOM');

-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('NONE', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'CREATOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateTable
CREATE TABLE "Network" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chainId" INTEGER,
    "type" "NetworkType" NOT NULL,
    "symbol" TEXT NOT NULL,
    "tokenStandard" "TokenStandard" NOT NULL,
    "rpcUrl" TEXT NOT NULL,
    "wsUrl" TEXT,
    "explorerUrl" TEXT,
    "isEnabledForBase" BOOLEAN NOT NULL DEFAULT false,
    "isEnabledForSplit" BOOLEAN NOT NULL DEFAULT false,
    "gasToken" TEXT,
    "avgBlockTimeMs" INTEGER,
    "iconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Network_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "passwordHash" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "diditId" TEXT,
    "googleId" TEXT,
    "twitterId" TEXT,
    "kycStatus" "KYCStatus" NOT NULL DEFAULT 'NONE',
    "kycVerifiedAt" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "networkType" "NetworkType" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "launchMode" "LaunchMode" NOT NULL,
    "baseChainId" TEXT NOT NULL,
    "splitNetworkIds" TEXT[],
    "totalSupply" DECIMAL(78,0) NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 18,
    "graduationTarget" DECIMAL(78,0) NOT NULL,
    "graduationAsset" TEXT NOT NULL DEFAULT 'ETH',
    "raisedAmount" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "bondingCurveType" "BondingCurveType" NOT NULL DEFAULT 'EXPONENTIAL',
    "initialPrice" DECIMAL(78,0),
    "priceMultiplier" DECIMAL(10,6),
    "maxPresaleSupply" DECIMAL(78,0),
    "status" "TokenStatus" NOT NULL DEFAULT 'DRAFT',
    "creatorId" TEXT NOT NULL,
    "creatorMultisig" TEXT,
    "websiteUrl" TEXT,
    "twitterUrl" TEXT,
    "discordUrl" TEXT,
    "telegramUrl" TEXT,
    "customLinks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "presaleStartedAt" TIMESTAMP(3),
    "graduatedAt" TIMESTAMP(3),

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenDeployment" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "tokenAddress" TEXT,
    "bridgeAddress" TEXT,
    "poolAddress" TEXT,
    "status" "DeploymentStatus" NOT NULL DEFAULT 'PENDING',
    "deploymentTxHash" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "deployedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresaleContribution" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "amount" DECIMAL(78,0) NOT NULL,
    "tokensReceived" DECIMAL(78,0) NOT NULL,
    "priceAtPurchase" DECIMAL(78,0) NOT NULL,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PresaleContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraduationLog" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "totalRaised" DECIMAL(78,0),
    "gasSpent" DECIMAL(78,0),
    "lpSeeded" DECIMAL(78,0),
    "treasuryRemainder" DECIMAL(78,0),
    "status" TEXT,
    "errorMessage" TEXT,
    "networkBreakdown" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GraduationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Multisig" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "signers" TEXT[],
    "threshold" INTEGER NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Multisig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Network_name_key" ON "Network"("name");

-- CreateIndex
CREATE INDEX "Network_type_idx" ON "Network"("type");

-- CreateIndex
CREATE INDEX "Network_isEnabledForBase_idx" ON "Network"("isEnabledForBase");

-- CreateIndex
CREATE INDEX "Network_isEnabledForSplit_idx" ON "Network"("isEnabledForSplit");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_diditId_key" ON "User"("diditId");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_twitterId_key" ON "User"("twitterId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_kycStatus_idx" ON "User"("kycStatus");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_address_networkType_key" ON "Wallet"("address", "networkType");

-- CreateIndex
CREATE INDEX "Token_status_idx" ON "Token"("status");

-- CreateIndex
CREATE INDEX "Token_creatorId_idx" ON "Token"("creatorId");

-- CreateIndex
CREATE INDEX "Token_launchMode_idx" ON "Token"("launchMode");

-- CreateIndex
CREATE INDEX "Token_createdAt_idx" ON "Token"("createdAt");

-- CreateIndex
CREATE INDEX "TokenDeployment_status_idx" ON "TokenDeployment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TokenDeployment_tokenId_networkId_key" ON "TokenDeployment"("tokenId", "networkId");

-- CreateIndex
CREATE INDEX "PresaleContribution_tokenId_idx" ON "PresaleContribution"("tokenId");

-- CreateIndex
CREATE INDEX "PresaleContribution_userId_idx" ON "PresaleContribution"("userId");

-- CreateIndex
CREATE INDEX "PresaleContribution_createdAt_idx" ON "PresaleContribution"("createdAt");

-- CreateIndex
CREATE INDEX "GraduationLog_tokenId_idx" ON "GraduationLog"("tokenId");

-- CreateIndex
CREATE INDEX "GraduationLog_status_idx" ON "GraduationLog"("status");

-- CreateIndex
CREATE INDEX "Multisig_ownerType_ownerId_idx" ON "Multisig"("ownerType", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Multisig_address_networkId_key" ON "Multisig"("address", "networkId");

-- CreateIndex
CREATE INDEX "AdminLog_adminId_idx" ON "AdminLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminLog_action_idx" ON "AdminLog"("action");

-- CreateIndex
CREATE INDEX "AdminLog_createdAt_idx" ON "AdminLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_name_key" ON "FeatureFlag"("name");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_baseChainId_fkey" FOREIGN KEY ("baseChainId") REFERENCES "Network"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenDeployment" ADD CONSTRAINT "TokenDeployment_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenDeployment" ADD CONSTRAINT "TokenDeployment_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "Network"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresaleContribution" ADD CONSTRAINT "PresaleContribution_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresaleContribution" ADD CONSTRAINT "PresaleContribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresaleContribution" ADD CONSTRAINT "PresaleContribution_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "Network"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraduationLog" ADD CONSTRAINT "GraduationLog_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE CASCADE ON UPDATE CASCADE;
