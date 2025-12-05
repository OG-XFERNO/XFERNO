'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TokenCard, TokenCardSkeleton } from './token-card';
import { useAllTokens, isChainSupported } from '@/lib/contracts';
import { useChainId } from 'wagmi';
import { ArrowRight, Flame } from 'lucide-react';

interface FeaturedTokensProps {
  title?: string;
  limit?: number;
  showViewAll?: boolean;
  className?: string;
}

export function FeaturedTokens({
  title = 'Trending Tokens',
  limit = 6,
  showViewAll = true,
  className = '',
}: FeaturedTokensProps) {
  const chainId = useChainId();
  const chainSupported = isChainSupported(chainId);
  const { tokens, isLoading } = useAllTokens();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get top tokens by liquidity
  const featuredTokens = tokens
    .sort((a, b) => (b.liquidity || 0) - (a.liquidity || 0))
    .slice(0, limit);

  if (!mounted) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="w-48 h-8" />
          <Skeleton className="w-24 h-10" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].slice(0, limit).map((i) => (
            <TokenCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="w-6 h-6 text-primary" />
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].slice(0, limit).map((i) => (
            <TokenCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // No tokens
  if (featuredTokens.length === 0) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="w-6 h-6 text-primary" />
            {title}
          </h2>
        </div>
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="py-12 text-center">
            <Flame className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tokens yet</h3>
            <p className="text-muted-foreground mb-4">
              {chainSupported 
                ? 'Be the first to launch a token on XFERNO!'
                : 'Connect to Sepolia or Base Sepolia to see tokens.'}
            </p>
            <Link href="/launch">
              <Button className="bg-gradient-fire hover:opacity-90">
                Launch First Token
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Flame className="w-6 h-6 text-primary" />
          {title}
        </h2>
        {showViewAll && (
          <Link href="/tokens">
            <Button variant="outline" className="gap-2">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {featuredTokens.map((token, index) => (
          <TokenCard
            key={token.tokenAddress}
            token={token}
            rank={index + 1}
            showRank
          />
        ))}
      </div>
    </div>
  );
}
