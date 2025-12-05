'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

interface OrderBookProps {
  tokenAddress?: string;
}

// Generate mock order book data (simulated liquidity depth for AMM)
function generateMockOrderBook(basePrice: number = 0.00042): { bids: OrderBookEntry[]; asks: OrderBookEntry[] } {
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];

  let bidTotal = 0;
  let askTotal = 0;

  for (let i = 0; i < 10; i++) {
    const bidAmount = Math.random() * 50000 + 10000;
    const askAmount = Math.random() * 50000 + 10000;
    bidTotal += bidAmount;
    askTotal += askAmount;

    bids.push({
      price: basePrice * (1 - (i + 1) * 0.001),
      amount: bidAmount,
      total: bidTotal,
    });

    asks.push({
      price: basePrice * (1 + (i + 1) * 0.001),
      amount: askAmount,
      total: askTotal,
    });
  }

  return { bids, asks: asks.reverse() };
}

export function OrderBook({ tokenAddress }: OrderBookProps) {
  // Note: AMMs don't have traditional order books - this shows simulated liquidity depth
  const { bids, asks } = useMemo(() => generateMockOrderBook(), []);

  const maxTotal = Math.max(
    Math.max(...bids.map((b) => b.total)),
    Math.max(...asks.map((a) => a.total))
  );

  const formatPrice = (price: number) => price.toFixed(8);
  const formatAmount = (amount: number) => {
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toFixed(0);
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-1">
            Liquidity Depth
            <span className="text-muted-foreground" title="AMM liquidity visualization">
              <Info className="w-3 h-3" />
            </span>
          </CardTitle>
          <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
            Simulated
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Header */}
        <div className="grid grid-cols-3 text-xs text-muted-foreground px-4 py-2 border-b border-border/50">
          <span>Price (ETH)</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Total</span>
        </div>

        {/* Asks (Sell orders) */}
        <div className="max-h-[150px] overflow-y-auto">
          {asks.map((ask, i) => (
            <div
              key={`ask-${i}`}
              className="relative grid grid-cols-3 text-xs px-4 py-1 hover:bg-muted/30"
            >
              <div
                className="absolute inset-0 bg-destructive/10"
                style={{ width: `${(ask.total / maxTotal) * 100}%`, right: 0, left: 'auto' }}
              />
              <span className="relative text-destructive">{formatPrice(ask.price)}</span>
              <span className="relative text-right">{formatAmount(ask.amount)}</span>
              <span className="relative text-right text-muted-foreground">
                {formatAmount(ask.total)}
              </span>
            </div>
          ))}
        </div>

        {/* Spread */}
        <div className="px-4 py-2 border-y border-border/50 bg-muted/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Spread</span>
            <span className="font-medium text-gradient-fire">
              {((asks[asks.length - 1]?.price - bids[0]?.price) / bids[0]?.price * 100).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Bids (Buy orders) */}
        <div className="max-h-[150px] overflow-y-auto">
          {bids.map((bid, i) => (
            <div
              key={`bid-${i}`}
              className="relative grid grid-cols-3 text-xs px-4 py-1 hover:bg-muted/30"
            >
              <div
                className="absolute inset-0 bg-success/10"
                style={{ width: `${(bid.total / maxTotal) * 100}%`, right: 0, left: 'auto' }}
              />
              <span className="relative text-success">{formatPrice(bid.price)}</span>
              <span className="relative text-right">{formatAmount(bid.amount)}</span>
              <span className="relative text-right text-muted-foreground">
                {formatAmount(bid.total)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
