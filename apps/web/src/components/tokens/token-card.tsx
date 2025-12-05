'use client';

import Link from 'next/link';
import { type Address, formatEther } from 'viem';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Zap, Crown } from 'lucide-react';
import { type TokenWithData } from '@/lib/contracts';

interface TokenCardProps {
  token: TokenWithData;
  rank?: number;
  showRank?: boolean;
}

export function TokenCard({ token, rank, showRank = false }: TokenCardProps) {
  const price = token.currentPrice 
    ? Number(formatEther(token.currentPrice)) 
    : 0;

  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(decimals)}K`;
    return `$${num.toFixed(decimals)}`;
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur hover:bg-muted/30 transition-colors group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Token Info */}
          <Link 
            href={`/tokens/${token.tokenAddress}`}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            {showRank && rank && (
              <div className="flex-shrink-0 w-6 text-center">
                {rank <= 3 ? (
                  <Crown className={`w-5 h-5 ${
                    rank === 1 ? 'text-yellow-500' : 
                    rank === 2 ? 'text-gray-400' : 
                    'text-amber-600'
                  }`} />
                ) : (
                  <span className="text-sm text-muted-foreground font-medium">{rank}</span>
                )}
              </div>
            )}
            
            <div className="w-12 h-12 rounded-full bg-gradient-fire flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {token.symbol?.slice(0, 2) || '??'}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                  {token.name}
                </h3>
                {token.graduated && (
                  <Badge variant="success" className="text-xs flex-shrink-0">
                    <Zap className="w-3 h-3 mr-1" />
                    Graduated
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">${token.symbol}</p>
            </div>
          </Link>

          {/* Price & Stats */}
          <div className="text-right flex-shrink-0">
            <p className="font-mono font-medium">
              ${price.toFixed(8)}
            </p>
            <p className="text-sm text-muted-foreground">
              {token.liquidity !== undefined ? `${token.liquidity.toFixed(3)} ETH` : '-'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Bonding Progress</span>
            <span>{token.bondingProgress?.toFixed(1) || 0}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-fire rounded-full transition-all duration-500"
              style={{ width: `${token.bondingProgress || 0}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Link href={`/tokens/${token.tokenAddress}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              View
            </Button>
          </Link>
          <Link href={`/trade?token=${token.tokenAddress}`} className="flex-1">
            <Button size="sm" className="w-full bg-gradient-fire hover:opacity-90">
              Trade
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading skeleton
export function TokenCardSkeleton() {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div>
              <Skeleton className="w-24 h-5 mb-1" />
              <Skeleton className="w-16 h-4" />
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="w-20 h-5 mb-1" />
            <Skeleton className="w-16 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <Skeleton className="w-full h-2 rounded-full" />
        </div>
        <div className="mt-4 flex gap-2">
          <Skeleton className="flex-1 h-8" />
          <Skeleton className="flex-1 h-8" />
        </div>
      </CardContent>
    </Card>
  );
}
