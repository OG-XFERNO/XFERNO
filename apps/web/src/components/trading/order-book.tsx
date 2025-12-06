'use client';

import { useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, TrendingUp, TrendingDown, Loader2, Rocket, Trophy } from 'lucide-react';
import { useTokenStats } from '@/lib/api/trading';
import { useTokenState, useCurveParams } from '@/lib/contracts';
import { Progress } from '@/components/ui/progress';

interface OrderBookProps {
  tokenAddress?: string;
  currentPrice?: number;
}

export function OrderBook({ tokenAddress, currentPrice }: OrderBookProps) {
  const chainId = useChainId();
  const { data: stats, isLoading } = useTokenStats(tokenAddress, chainId);
  
  // Get bonding curve data from contract
  const { data: tokenState } = useTokenState(tokenAddress as `0x${string}` | undefined);
  const { data: curveParams } = useCurveParams();
  
  const hasToken = !!tokenAddress;
  const hasStats = !!stats;

  // Calculate bonding progress
  const ethReserve = tokenState?.ethReserve ? BigInt(tokenState.ethReserve.toString()) : BigInt(0);
  const graduationThreshold = curveParams?.graduationThreshold 
    ? BigInt(curveParams.graduationThreshold.toString()) 
    : BigInt('6900000000000000000'); // Default 6.9 ETH
  
  const bondingProgress = graduationThreshold > 0 
    ? Math.min(100, Number((ethReserve * BigInt(100)) / graduationThreshold))
    : 0;
  
  const ethReserveFormatted = parseFloat(formatEther(ethReserve));
  const graduationThresholdFormatted = parseFloat(formatEther(graduationThreshold));
  const isGraduated = tokenState?.graduated || false;

  // Format price for display - show full decimals, not scientific notation
  const formatPrice = (price: number | string | undefined) => {
    if (!price) return '---';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (num === 0) return '---';
    // Show up to 12 decimal places, trimming trailing zeros
    if (num < 0.000001) {
      return num.toFixed(12).replace(/\.?0+$/, '');
    } else if (num < 0.001) {
      return num.toFixed(9).replace(/\.?0+$/, '');
    } else if (num < 1) {
      return num.toFixed(6).replace(/\.?0+$/, '');
    }
    return num.toFixed(4);
  };

  // Format volume - show full ETH value
  const formatVolume = (vol: string | undefined) => {
    if (!vol) return '0';
    const num = parseFloat(vol) / 1e18;
    if (num === 0) return '0';
    if (num < 0.000001) {
      return num.toFixed(9).replace(/\.?0+$/, '');
    } else if (num < 0.001) {
      return num.toFixed(6).replace(/\.?0+$/, '');
    } else if (num < 1) {
      return num.toFixed(4);
    }
    return num.toFixed(2);
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
                {currentPrice ? `${formatPrice(currentPrice)} ETH` : '---'}
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

            {/* Bonding Progress */}
            <div className="py-4 px-3 border border-border/50 rounded-lg bg-gradient-to-r from-orange-500/5 to-yellow-500/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isGraduated ? (
                    <Trophy className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <Rocket className="w-4 h-4 text-orange-500" />
                  )}
                  <span className="text-sm font-medium">
                    {isGraduated ? 'Graduated!' : 'Bonding Progress'}
                  </span>
                </div>
                <span className="text-sm font-bold text-gradient-fire">
                  {bondingProgress < 1 ? bondingProgress.toFixed(4) : bondingProgress.toFixed(2)}%
                </span>
              </div>
              
              <Progress 
                value={bondingProgress} 
                className="h-3 bg-muted/50"
                indicatorClassName={isGraduated 
                  ? 'bg-gradient-to-r from-yellow-500 to-green-500' 
                  : 'bg-gradient-fire'
                }
              />
              
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{ethReserveFormatted < 0.0001 ? ethReserveFormatted.toFixed(8) : ethReserveFormatted.toFixed(4)} ETH</span>
                <span>Goal: {graduationThresholdFormatted} ETH</span>
              </div>
              
              {!isGraduated && bondingProgress >= 90 && (
                <p className="text-xs text-center mt-2 text-yellow-500 font-medium animate-pulse">
                  🚀 Almost there! Ready to graduate soon!
                </p>
              )}
              
              {isGraduated && (
                <p className="text-xs text-center mt-2 text-green-500 font-medium">
                  ✨ Token has graduated to DEX liquidity!
                </p>
              )}
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
