'use client';

import { useMemo } from 'react';
import { useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useRecentTrades, useTradeSocket, type Trade as ApiTrade } from '@/lib/api/trading';
import { cn } from '@/lib/utils';

interface Trade {
  id: string;
  type: 'buy' | 'sell';
  price: number;
  amount: number;
  total: number;
  time: Date;
  txHash?: string;
}

interface RecentTradesProps {
  tokenAddress?: string;
}

// Convert API trades to display format
function apiTradesToDisplay(apiTrades: ApiTrade[]): Trade[] {
  return apiTrades.map((t) => ({
    id: t.id,
    type: t.tradeType === 'BUY' ? 'buy' : 'sell',
    price: parseFloat(t.pricePerToken),
    amount: parseFloat(t.tokenAmount) / 1e18, // Convert from wei
    total: parseFloat(t.ethAmount) / 1e18, // Convert from wei
    time: new Date(t.blockTimestamp),
    txHash: t.txHash,
  }));
}

export function RecentTrades({ tokenAddress }: RecentTradesProps) {
  const chainId = useChainId();
  
  // Fetch trades from API
  const { data: apiTrades, isLoading } = useRecentTrades(tokenAddress, chainId);
  
  // Real-time WebSocket updates
  const { isConnected, lastTrade } = useTradeSocket(tokenAddress, chainId);

  // Convert API trades - no mock fallback
  const trades = useMemo(() => {
    if (apiTrades && apiTrades.length > 0) {
      return apiTradesToDisplay(apiTrades);
    }
    return []; // Empty - no mock data
  }, [apiTrades]);

  const hasRealData = apiTrades && apiTrades.length > 0;

  // Format price with full decimals for small values
  const formatPrice = (price: number) => {
    if (price === 0) return '0';
    if (price < 0.000001) {
      return price.toFixed(12).replace(/\.?0+$/, '');
    } else if (price < 0.001) {
      return price.toFixed(9).replace(/\.?0+$/, '');
    } else if (price < 1) {
      return price.toFixed(6).replace(/\.?0+$/, '');
    }
    return price.toFixed(4);
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1e12) return `${(amount / 1e12).toFixed(1)}T`;
    if (amount >= 1e9) return `${(amount / 1e9).toFixed(1)}B`;
    if (amount >= 1e6) return `${(amount / 1e6).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toFixed(0);
  };

  const formatTotal = (total: number) => {
    if (total < 0.000001) {
      return total.toFixed(9).replace(/\.?0+$/, '');
    } else if (total < 0.001) {
      return total.toFixed(6);
    }
    return total.toFixed(4);
  };
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Recent Trades</CardTitle>
          <span className={cn(
            'text-xs px-2 py-0.5 rounded flex items-center gap-1',
            hasRealData 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-yellow-500/20 text-yellow-400'
          )}>
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : hasRealData ? (
              <>
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isConnected ? 'bg-green-400 animate-pulse' : 'bg-green-400'
                )} />
                Live
              </>
            ) : (
              'Demo'
            )}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Header */}
        <div className="grid grid-cols-4 text-xs text-muted-foreground px-4 py-2 border-b border-border/50">
          <span>Price (ETH)</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Total</span>
          <span className="text-right">Time</span>
        </div>

        {/* Trades List */}
        <div className="max-h-[340px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : trades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="text-3xl mb-2">📈</div>
              <p className="text-sm font-medium">No Trades Yet</p>
              <p className="text-xs mt-1">Be the first to trade!</p>
            </div>
          ) : (
            trades.map((trade) => (
              <div
                key={trade.id}
                className="grid grid-cols-4 text-xs px-4 py-1.5 hover:bg-muted/30 transition-colors"
              >
                <span className={trade.type === 'buy' ? 'text-success' : 'text-destructive'}>
                  <span className="inline-flex items-center gap-1">
                    {trade.type === 'buy' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {formatPrice(trade.price)}
                  </span>
                </span>
                <span className="text-right">{formatAmount(trade.amount)}</span>
                <span className="text-right text-muted-foreground">
                  {formatTotal(trade.total)}
                </span>
                <span className="text-right text-muted-foreground">
                  {formatTime(trade.time)}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
