'use client';

import { useState, useMemo, useEffect } from 'react';
import { useChainId } from 'wagmi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TokenCard, TokenCardSkeleton } from './token-card';
import { useAllTokens, isChainSupported, areContractsDeployed, type TokenWithData } from '@/lib/contracts';
import { Flame, Clock, TrendingUp, Star, RefreshCw, AlertCircle } from 'lucide-react';

export type SortOption = 'trending' | 'new' | 'gainers' | 'liquidity' | 'progress';

interface TokenListProps {
  searchQuery?: string;
  sortBy?: SortOption;
  limit?: number;
  showRefresh?: boolean;
  emptyMessage?: string;
  className?: string;
  requireAuth?: boolean;
  onNeedAuth?: () => void;
}

export function TokenList({
  searchQuery = '',
  sortBy = 'new',
  limit,
  showRefresh = true,
  emptyMessage = 'No tokens found',
  className = '',
  requireAuth = false,
  onNeedAuth,
}: TokenListProps) {
  const chainId = useChainId();
  const chainSupported = isChainSupported(chainId);
  const { tokens, isLoading, error, refetch } = useAllTokens();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter and sort tokens
  const filteredTokens = useMemo(() => {
    let result = [...tokens];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name?.toLowerCase().includes(query) ||
          t.symbol?.toLowerCase().includes(query) ||
          t.tokenAddress?.toLowerCase().includes(query) ||
          t.creator?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'trending':
        // Sort by liquidity (most active)
        result.sort((a, b) => (b.liquidity || 0) - (a.liquidity || 0));
        break;
      case 'new':
        // Sort by block number (newest first)
        result.sort((a, b) => Number(b.blockNumber - a.blockNumber));
        break;
      case 'gainers':
        // Sort by progress (highest first)
        result.sort((a, b) => (b.bondingProgress || 0) - (a.bondingProgress || 0));
        break;
      case 'liquidity':
        result.sort((a, b) => (b.liquidity || 0) - (a.liquidity || 0));
        break;
      case 'progress':
        result.sort((a, b) => (b.bondingProgress || 0) - (a.bondingProgress || 0));
        break;
    }

    // Apply limit
    if (limit) {
      result = result.slice(0, limit);
    }

    return result;
  }, [tokens, searchQuery, sortBy, limit]);

  // Loading skeleton
  if (!mounted || isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <TokenCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Chain not supported
  if (!chainSupported) {
    return (
      <Card className={`border-border/50 bg-card/50 backdrop-blur ${className}`}>
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Network Not Supported</h3>
          <p className="text-muted-foreground">
            Please switch to Sepolia or Base Sepolia to view tokens.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Contracts not deployed on this chain
  if (!areContractsDeployed(chainId)) {
    return (
      <Card className={`border-border/50 bg-card/50 backdrop-blur ${className}`}>
        <CardContent className="py-12 text-center">
          <Flame className="w-12 h-12 mx-auto text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Tokens Yet</h3>
          <p className="text-muted-foreground mb-4">
            Be the first to launch a token on this network!
          </p>
          <Button asChild className="bg-gradient-fire hover:opacity-90">
            <a href="/launch">Launch Token</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={`border-border/50 bg-card/50 backdrop-blur ${className}`}>
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Tokens</h3>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={refetch} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (filteredTokens.length === 0) {
    return (
      <Card className={`border-border/50 bg-card/50 backdrop-blur ${className}`}>
        <CardContent className="py-12 text-center">
          <Flame className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{emptyMessage}</h3>
          <p className="text-muted-foreground mb-4">
            {tokens.length === 0 
              ? 'Be the first to launch a token on XFERNO!'
              : 'Try adjusting your search or filters.'}
          </p>
          {showRefresh && (
            <Button onClick={refetch} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {showRefresh && (
        <div className="flex justify-end mb-4">
          <Button 
            onClick={refetch} 
            variant="ghost" 
            size="sm" 
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTokens.map((token, index) => (
          <TokenCard 
            key={token.tokenAddress} 
            token={token} 
            rank={index + 1}
            showRank={sortBy === 'trending' || sortBy === 'liquidity'}
            requireAuth={requireAuth}
            onNeedAuth={onNeedAuth}
          />
        ))}
      </div>
    </div>
  );
}

// Stats component for the tokens page header
export function TokenStats() {
  const chainId = useChainId();
  const contractsDeployed = areContractsDeployed(chainId);
  const { tokens, isLoading } = useAllTokens();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="pt-4">
              <Skeleton className="w-24 h-4 mb-2" />
              <Skeleton className="w-16 h-8" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Show zeros if contracts not deployed
  const totalLiquidity = contractsDeployed ? tokens.reduce((sum, t) => sum + (t.liquidity || 0), 0) : 0;
  const graduatedCount = contractsDeployed ? tokens.filter(t => t.graduated).length : 0;
  const activeCount = contractsDeployed ? tokens.filter(t => (t.bondingProgress || 0) > 0 && !t.graduated).length : 0;
  const tokenCount = contractsDeployed ? tokens.length : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Flame className="h-4 w-4 text-primary" />
            Total Tokens
          </div>
          <p className="text-2xl font-bold">{tokenCount}</p>
        </CardContent>
      </Card>
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <TrendingUp className="h-4 w-4 text-primary" />
            Total Liquidity
          </div>
          <p className="text-2xl font-bold">{totalLiquidity.toFixed(2)} ETH</p>
        </CardContent>
      </Card>
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Star className="h-4 w-4 text-primary" />
            Graduated
          </div>
          <p className="text-2xl font-bold">{graduatedCount}</p>
        </CardContent>
      </Card>
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Clock className="h-4 w-4 text-primary" />
            Active
          </div>
          <p className="text-2xl font-bold">{activeCount}</p>
        </CardContent>
      </Card>
    </div>
  );
}
