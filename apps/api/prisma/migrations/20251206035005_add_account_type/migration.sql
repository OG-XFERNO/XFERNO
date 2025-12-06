-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('SOCIAL', 'TRADER', 'CREATOR');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'SOCIAL';

-- CreateIndex
CREATE INDEX "User_accountType_idx" ON "User"("accountType");
