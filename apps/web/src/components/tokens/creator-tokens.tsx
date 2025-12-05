'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { type Address, formatEther } from 'viem';
import { useChainId } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TokenCard, TokenCardSkeleton } from './token-card';
import {
  useAllTokens,
  isChainSupported,
  getExplorerAddressUrl,
  type TokenWithData,
} from '@/lib/contracts';
import {
  User,
  Flame,
  ExternalLink,
  Copy,
  Check,
  Coins,
  TrendingUp,
} from 'lucide-react';

interface CreatorTokensProps {
  creatorAddress: Address;
  className?: string;
}

export function CreatorTokens({ creatorAddress, className }: CreatorTokensProps) {
  const chainId = useChainId();
  const chainSupported = isChainSupported(chainId);
  const { tokens, isLoading } = useAllTokens();
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter tokens by creator
  const creatorTokens = useMemo(() => {
    return tokens.filter(
      (t) => t.creator?.toLowerCase() === creatorAddress.toLowerCase()
    );
  }, [tokens, creatorAddress]);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(creatorAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const explorerUrl = getExplorerAddressUrl(chainId, creatorAddress);

  // Calculate creator stats
  const totalLiquidity = creatorTokens.reduce((sum, t) => sum + (t.liquidity || 0), 0);
  const graduatedCount = creatorTokens.filter((t) => t.graduated).length;

  if (!mounted || isLoading) {
    return (
      <div className={className}>
        <Card className="border-border/50 bg-card/50 backdrop-blur mb-6">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div>
                <Skeleton className="w-40 h-6 mb-2" />
                <Skeleton className="w-24 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <TokenCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Creator Header */}
      <Card className="border-border/50 bg-card/50 backdrop-blur mb-6">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-fire flex items-center justify-center text-white">
              <User className="w-8 h-8" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <h2 className="text-xl font-bold">Creator</h2>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                {explorerUrl && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                    <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
              <p className="font-mono text-sm text-muted-foreground break-all">
                {creatorAddress}
              </p>
            </div>
          </div>

          {/* Creator Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm mb-1">
                <Flame className="w-4 h-4" />
                Tokens
              </div>
              <p className="text-2xl font-bold">{creatorTokens.length}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm mb-1">
                <Coins className="w-4 h-4" />
                Total Liquidity
              </div>
              <p className="text-2xl font-bold">{totalLiquidity.toFixed(2)} ETH</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                Graduated
              </div>
              <p className="text-2xl font-bold">{graduatedCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creator's Tokens */}
      <h3 className="text-lg font-semibold mb-4">Created Tokens</h3>
      
      {creatorTokens.length === 0 ? (
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="py-12 text-center">
            <Flame className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              This creator hasn't launched any tokens yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creatorTokens.map((token) => (
            <TokenCard key={token.tokenAddress} token={token} />
          ))}
        </div>
      )}
    </div>
  );
}
