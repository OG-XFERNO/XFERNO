-- CreateEnum
CREATE TYPE "TradeType" AS ENUM ('BUY', 'SELL');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'manual',
    "externalId" TEXT,
    "status" "KYCStatus" NOT NULL DEFAULT 'PENDING',
    "documentType" TEXT,
    "documentCountry" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "traderAddress" TEXT NOT NULL,
    "tradeType" "TradeType" NOT NULL,
    "ethAmount" DECIMAL(78,0) NOT NULL,
    "tokenAmount" DECIMAL(78,0) NOT NULL,
    "pricePerToken" DECIMAL(78,18) NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "blockTimestamp" TIMESTAMP(3) NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "chainId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceCandle" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "interval" TEXT NOT NULL,
    "openTime" TIMESTAMP(3) NOT NULL,
    "closeTime" TIMESTAMP(3) NOT NULL,
    "open" DECIMAL(78,18) NOT NULL,
    "high" DECIMAL(78,18) NOT NULL,
    "low" DECIMAL(78,18) NOT NULL,
    "close" DECIMAL(78,18) NOT NULL,
    "volume" DECIMAL(78,0) NOT NULL,
    "tradeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceCandle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexerState" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "lastBlockNumber" BIGINT NOT NULL,
    "lastBlockHash" TEXT,
    "isRunning" BOOLEAN NOT NULL DEFAULT false,
    "lastError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexerState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenStats" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "currentPrice" DECIMAL(78,18) NOT NULL,
    "priceChange24h" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "volume24h" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "trades24h" INTEGER NOT NULL DEFAULT 0,
    "totalVolume" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "holders" INTEGER NOT NULL DEFAULT 0,
    "marketCap" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "liquidity" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "allTimeHigh" DECIMAL(78,18) NOT NULL DEFAULT 0,
    "allTimeLow" DECIMAL(78,18) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshToken_key" ON "Session"("refreshToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "KycVerification_userId_idx" ON "KycVerification"("userId");

-- CreateIndex
CREATE INDEX "KycVerification_status_idx" ON "KycVerification"("status");

-- CreateIndex
CREATE INDEX "KycVerification_provider_externalId_idx" ON "KycVerification"("provider", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Trade_txHash_key" ON "Trade"("txHash");

-- CreateIndex
CREATE INDEX "Trade_tokenAddress_idx" ON "Trade"("tokenAddress");

-- CreateIndex
CREATE INDEX "Trade_traderAddress_idx" ON "Trade"("traderAddress");

-- CreateIndex
CREATE INDEX "Trade_blockTimestamp_idx" ON "Trade"("blockTimestamp");

-- CreateIndex
CREATE INDEX "Trade_chainId_tokenAddress_idx" ON "Trade"("chainId", "tokenAddress");

-- CreateIndex
CREATE INDEX "Trade_tokenAddress_blockTimestamp_idx" ON "Trade"("tokenAddress", "blockTimestamp");

-- CreateIndex
CREATE INDEX "PriceCandle_tokenAddress_chainId_interval_idx" ON "PriceCandle"("tokenAddress", "chainId", "interval");

-- CreateIndex
CREATE INDEX "PriceCandle_openTime_idx" ON "PriceCandle"("openTime");

-- CreateIndex
CREATE UNIQUE INDEX "PriceCandle_tokenAddress_chainId_interval_openTime_key" ON "PriceCandle"("tokenAddress", "chainId", "interval", "openTime");

-- CreateIndex
CREATE UNIQUE INDEX "IndexerState_chainId_key" ON "IndexerState"("chainId");

-- CreateIndex
CREATE INDEX "IndexerState_chainId_idx" ON "IndexerState"("chainId");

-- CreateIndex
CREATE INDEX "TokenStats_chainId_idx" ON "TokenStats"("chainId");

-- CreateIndex
CREATE INDEX "TokenStats_volume24h_idx" ON "TokenStats"("volume24h");

-- CreateIndex
CREATE INDEX "TokenStats_priceChange24h_idx" ON "TokenStats"("priceChange24h");

-- CreateIndex
CREATE UNIQUE INDEX "TokenStats_tokenAddress_chainId_key" ON "TokenStats"("tokenAddress", "chainId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycVerification" ADD CONSTRAINT "KycVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
