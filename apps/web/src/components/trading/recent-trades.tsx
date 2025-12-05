'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Trade {
  id: string;
  type: 'buy' | 'sell';
  price: number;
  amount: number;
  total: number;
  time: Date;
}

// Generate mock recent trades
function generateMockTrades(count: number = 20): Trade[] {
  const trades: Trade[] = [];
  const basePrice = 0.00042;
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const type = Math.random() > 0.5 ? 'buy' : 'sell';
    const price = basePrice * (1 + (Math.random() - 0.5) * 0.02);
    const amount = Math.random() * 30000 + 1000;

    trades.push({
      id: `trade-${i}`,
      type,
      price,
      amount,
      total: price * amount,
      time: new Date(now - i * 30000 - Math.random() * 30000),
    });
  }

  return trades;
}

export function RecentTrades() {
  const trades = useMemo(() => generateMockTrades(20), []);

  const formatPrice = (price: number) => price.toFixed(8);
  const formatAmount = (amount: number) => {
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toFixed(0);
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
        <CardTitle className="text-sm font-medium">Recent Trades</CardTitle>
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
          {trades.map((trade) => (
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
                {trade.total.toFixed(4)}
              </span>
              <span className="text-right text-muted-foreground">
                {formatTime(trade.time)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
