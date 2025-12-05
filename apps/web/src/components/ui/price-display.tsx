'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceDisplayProps {
  value: number | string | bigint;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  showSign?: boolean;
  compact?: boolean;
}

export function PriceDisplay({
  value,
  prefix = '$',
  suffix = '',
  decimals = 2,
  className,
  showSign = false,
  compact = false,
}: PriceDisplayProps) {
  const formattedValue = useMemo(() => {
    let num = typeof value === 'bigint' ? Number(value) : Number(value);
    
    if (isNaN(num)) return '0';
    
    if (compact) {
      if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
      if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
      if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    }
    
    // For very small numbers (like token prices)
    if (num > 0 && num < 0.0001) {
      return num.toFixed(8);
    }
    
    return num.toFixed(decimals);
  }, [value, decimals, compact]);

  const sign = showSign && Number(value) > 0 ? '+' : '';

  return (
    <span className={cn('font-mono tabular-nums', className)}>
      {sign}{prefix}{formattedValue}{suffix}
    </span>
  );
}

// Price with change indicator
interface PriceWithChangeProps {
  price: number;
  change?: number;
  prefix?: string;
  priceDecimals?: number;
  changeDecimals?: number;
  className?: string;
  compact?: boolean;
}

export function PriceWithChange({
  price,
  change = 0,
  prefix = '$',
  priceDecimals = 2,
  changeDecimals = 2,
  className,
  compact = false,
}: PriceWithChangeProps) {
  const changeColor = change > 0 
    ? 'text-green-500' 
    : change < 0 
      ? 'text-red-500' 
      : 'text-muted-foreground';

  const ChangeIcon = change > 0 
    ? TrendingUp 
    : change < 0 
      ? TrendingDown 
      : Minus;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <PriceDisplay 
        value={price} 
        prefix={prefix} 
        decimals={priceDecimals} 
        compact={compact}
      />
      <span className={cn('flex items-center gap-1 text-sm', changeColor)}>
        <ChangeIcon className="w-3 h-3" />
        <span>{change > 0 ? '+' : ''}{change.toFixed(changeDecimals)}%</span>
      </span>
    </div>
  );
}

// ETH amount display
interface EthDisplayProps {
  value: number | bigint;
  decimals?: number;
  className?: string;
  showSymbol?: boolean;
  compact?: boolean;
}

export function EthDisplay({
  value,
  decimals = 4,
  className,
  showSymbol = true,
  compact = false,
}: EthDisplayProps) {
  return (
    <PriceDisplay
      value={value}
      prefix=""
      suffix={showSymbol ? ' ETH' : ''}
      decimals={decimals}
      className={className}
      compact={compact}
    />
  );
}

// Token amount display
interface TokenDisplayProps {
  value: number | bigint;
  symbol?: string;
  decimals?: number;
  className?: string;
  compact?: boolean;
}

export function TokenDisplay({
  value,
  symbol = '',
  decimals = 2,
  className,
  compact = true,
}: TokenDisplayProps) {
  return (
    <PriceDisplay
      value={value}
      prefix=""
      suffix={symbol ? ` ${symbol}` : ''}
      decimals={decimals}
      className={className}
      compact={compact}
    />
  );
}

// Percentage display
interface PercentDisplayProps {
  value: number;
  decimals?: number;
  className?: string;
  showSign?: boolean;
  colored?: boolean;
}

export function PercentDisplay({
  value,
  decimals = 2,
  className,
  showSign = true,
  colored = true,
}: PercentDisplayProps) {
  const color = colored
    ? value > 0
      ? 'text-green-500'
      : value < 0
        ? 'text-red-500'
        : ''
    : '';

  return (
    <span className={cn('font-mono tabular-nums', color, className)}>
      {showSign && value > 0 ? '+' : ''}{value.toFixed(decimals)}%
    </span>
  );
}
