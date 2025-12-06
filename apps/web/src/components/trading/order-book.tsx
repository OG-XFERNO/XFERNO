'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface OrderBookProps {
  tokenAddress?: string;
  currentPrice?: number;
}

export function OrderBook({ tokenAddress, currentPrice }: OrderBookProps) {
  // AMMs don't have traditional order books - show bonding curve info instead
  const hasToken = !!tokenAddress;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-1">
            Bonding Curve
            <span className="text-muted-foreground" title="AMM uses bonding curve pricing">
              <Info className="w-3 h-3" />
            </span>
          </CardTitle>
          {hasToken && (
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
              AMM
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {!hasToken ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <div className="text-3xl mb-2">📉</div>
            <p className="text-sm font-medium">No Token Selected</p>
            <p className="text-xs mt-1">Select a token to view pricing</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Bonding Curve Info */}
            <div className="text-center py-4 border border-border/50 rounded-lg bg-muted/20">
              <p className="text-xs text-muted-foreground mb-1">Current Price</p>
              <p className="text-2xl font-bold text-gradient-fire">
                {currentPrice ? `${currentPrice.toFixed(8)} ETH` : '---'}
              </p>
            </div>

            {/* Curve Explanation */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-muted-foreground">Pricing Model</span>
                <span className="font-medium">Bonding Curve</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-muted-foreground">Buy Price Impact</span>
                <span className="text-success">Price increases ↑</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-muted-foreground">Sell Price Impact</span>
                <span className="text-destructive">Price decreases ↓</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Slippage</span>
                <span className="font-medium">Variable (size dependent)</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Prices are determined algorithmically by the bonding curve. 
              Larger trades have more price impact.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
