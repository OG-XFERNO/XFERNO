'use client';

import { useAccount, useChainId } from 'wagmi';
import { type Address, formatEther } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useTokensByCreator,
  useTokenBalance,
  useTokenInfo,
  useCurrentPrice,
  isChainSupported,
} from '@/lib/contracts';
import { Wallet, Coins, TrendingUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface TokenBalancesProps {
  className?: string;
  maxItems?: number;
}

export function TokenBalances({ className, maxItems = 5 }: TokenBalancesProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const chainSupported = isChainSupported(chainId);

  // Get tokens created by user
  const { data: createdTokens, isLoading } = useTokensByCreator(address);

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Connect wallet to view your tokens
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!chainSupported) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <Coins className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Switch to a supported network to view tokens
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Your Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div>
                  <Skeleton className="w-20 h-4 mb-1" />
                  <Skeleton className="w-16 h-3" />
                </div>
              </div>
              <Skeleton className="w-16 h-4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const tokens = createdTokens?.slice(0, maxItems) || [];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Your Tokens
          </span>
          {createdTokens && createdTokens.length > 0 && (
            <Badge variant="outline">{createdTokens.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tokens.length === 0 ? (
          <div className="text-center py-6">
            <Coins className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm mb-3">
              No tokens created yet
            </p>
            <Button asChild size="sm">
              <Link href="/launch">Create Token</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {tokens.map((tokenAddress) => (
              <TokenBalanceItem
                key={tokenAddress}
                tokenAddress={tokenAddress}
                userAddress={address!}
              />
            ))}
            {createdTokens && createdTokens.length > maxItems && (
              <Button variant="ghost" className="w-full text-sm" asChild>
                <Link href="/tokens">
                  View all {createdTokens.length} tokens
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Individual token balance item
function TokenBalanceItem({
  tokenAddress,
  userAddress,
}: {
  tokenAddress: Address;
  userAddress: Address;
}) {
  const tokenInfo = useTokenInfo(tokenAddress);
  const { data: balance } = useTokenBalance(tokenAddress, userAddress);
  const { data: price } = useCurrentPrice(tokenAddress);

  const balanceFormatted = balance ? parseFloat(formatEther(balance)) : 0;
  const priceFormatted = price ? parseFloat(formatEther(price)) : 0;
  const valueUsd = balanceFormatted * priceFormatted;

  if (tokenInfo.isLoading) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg border animate-pulse">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div>
            <Skeleton className="w-20 h-4 mb-1" />
            <Skeleton className="w-16 h-3" />
          </div>
        </div>
        <Skeleton className="w-16 h-4" />
      </div>
    );
  }

  if (!tokenInfo.name) return null;

  return (
    <Link
      href={`/trade?token=${tokenAddress}`}
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-fire flex items-center justify-center text-white font-bold">
          {tokenInfo.symbol?.slice(0, 2) || '??'}
        </div>
        <div>
          <p className="font-medium text-sm">{tokenInfo.symbol}</p>
          <p className="text-xs text-muted-foreground">
            {balanceFormatted > 1000000
              ? `${(balanceFormatted / 1000000).toFixed(2)}M`
              : balanceFormatted > 1000
              ? `${(balanceFormatted / 1000).toFixed(2)}K`
              : balanceFormatted.toFixed(2)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-sm">
          ${valueUsd.toFixed(2)}
        </p>
        {tokenInfo.graduated && (
          <Badge variant="success" className="text-xs">
            Graduated
          </Badge>
        )}
      </div>
    </Link>
  );
}
