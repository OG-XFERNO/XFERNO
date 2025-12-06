'use client';

import { useChainId } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useTokenStats } from '@/lib/api/trading';

interface OrderBookProps {
  tokenAddress?: string;
  currentPrice?: number;
}

export function OrderBook({ tokenAddress, currentPrice }: OrderBookProps) {
  const chainId = useChainId();
  const { data: stats, isLoading } = useTokenStats(tokenAddress, chainId);
  
  const hasToken = !!tokenAddress;
  const hasStats = !!stats;

  // Format price for display
  const formatPrice = (price: number | string | undefined) => {
    if (!price) return '---';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (num === 0) return '---';
    return num.toExponential(4);
  };

  // Format volume
  const formatVolume = (vol: string | undefined) => {
    if (!vol) return '0';
    const num = parseFloat(vol) / 1e18;
    if (num < 0.001) return num.toExponential(2);
    return num.toFixed(4);
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-1">
            Token Stats
            <span className="text-muted-foreground" title="Real-time indexed data">
              <Info className="w-3 h-3" />
            </span>
          </CardTitle>
          {hasToken && (
            <span className={`text-xs px-2 py-0.5 rounded ${hasStats ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : hasStats ? '● Live' : 'AMM'}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {!hasToken ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <div className="text-3xl mb-2">📉</div>
            <p className="text-sm font-medium">No Token Selected</p>
            <p className="text-xs mt-1">Select a token to view stats</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Price */}
            <div className="text-center py-4 border border-border/50 rounded-lg bg-muted/20">
              <p className="text-xs text-muted-foreground mb-1">Current Price</p>
              <p className="text-2xl font-bold text-gradient-fire">
                {currentPrice ? `${currentPrice.toExponential(4)} ETH` : '---'}
              </p>
              {stats?.priceChange24h !== undefined && stats.priceChange24h !== 0 && (
                <div className={`flex items-center justify-center gap-1 mt-1 text-sm ${stats.priceChange24h >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {stats.priceChange24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stats.priceChange24h.toFixed(2)}% (24h)
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 border border-border/30 rounded-lg">
                <p className="text-muted-foreground">24h Volume</p>
                <p className="font-medium mt-1">{formatVolume(stats?.volume24h)} ETH</p>
              </div>
              <div className="p-3 border border-border/30 rounded-lg">
                <p className="text-muted-foreground">Total Trades</p>
                <p className="font-medium mt-1">{stats?.totalTrades ?? 0}</p>
              </div>
              <div className="p-3 border border-border/30 rounded-lg">
                <p className="text-muted-foreground">All-Time High</p>
                <p className="font-medium mt-1 text-success">{formatPrice(stats?.allTimeHigh)} ETH</p>
              </div>
              <div className="p-3 border border-border/30 rounded-lg">
                <p className="text-muted-foreground">All-Time Low</p>
                <p className="font-medium mt-1 text-destructive">{formatPrice(stats?.allTimeLow)} ETH</p>
              </div>
            </div>

            {/* Total Volume */}
            <div className="text-center py-3 border border-border/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Volume</p>
              <p className="font-bold text-lg">{formatVolume(stats?.totalVolume)} ETH</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
