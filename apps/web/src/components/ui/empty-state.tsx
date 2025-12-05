'use client';

import { type ReactNode } from 'react';
import { Card, CardContent } from './card';
import { Button } from './button';
import {
  Flame,
  Search,
  Wallet,
  TrendingUp,
  Coins,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  children?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Flame,
  title,
  description,
  action,
  secondaryAction,
  children,
  className = '',
}: EmptyStateProps) {
  return (
    <Card className={`border-border/50 bg-card/50 backdrop-blur ${className}`}>
      <CardContent className="py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-muted-foreground max-w-md mx-auto mb-6">{description}</p>
        )}
        {children}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            {action && (
              action.href ? (
                <Button asChild className="bg-gradient-fire hover:opacity-90">
                  <a href={action.href}>{action.label}</a>
                </Button>
              ) : (
                <Button 
                  className="bg-gradient-fire hover:opacity-90"
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              )
            )}
            {secondaryAction && (
              secondaryAction.href ? (
                <Button asChild variant="outline">
                  <a href={secondaryAction.href}>{secondaryAction.label}</a>
                </Button>
              ) : (
                <Button variant="outline" onClick={secondaryAction.onClick}>
                  {secondaryAction.label}
                </Button>
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Pre-configured empty states for common scenarios
export function NoTokensState({ onLaunch }: { onLaunch?: () => void }) {
  return (
    <EmptyState
      icon={Flame}
      title="No Tokens Yet"
      description="Be the first to launch a token on XFERNO!"
      action={{
        label: 'Launch Token',
        href: '/launch',
      }}
    />
  );
}

export function NoResultsState({ query, onClear }: { query: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="No Results Found"
      description={`No tokens matching "${query}". Try a different search term.`}
      action={onClear ? {
        label: 'Clear Search',
        onClick: onClear,
      } : undefined}
    />
  );
}

export function ConnectWalletState() {
  return (
    <EmptyState
      icon={Wallet}
      title="Connect Your Wallet"
      description="Connect your wallet to start trading and launching tokens."
    />
  );
}

export function NoTradesState() {
  return (
    <EmptyState
      icon={TrendingUp}
      title="No Recent Trades"
      description="Be the first to trade this token!"
    />
  );
}

export function NoBalanceState({ tokenSymbol }: { tokenSymbol?: string }) {
  return (
    <EmptyState
      icon={Coins}
      title="No Balance"
      description={tokenSymbol 
        ? `You don't have any ${tokenSymbol} tokens yet.`
        : "You don't have any tokens yet."
      }
      action={{
        label: 'Explore Tokens',
        href: '/tokens',
      }}
    />
  );
}

export function NetworkErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Network Error"
      description="Unable to connect to the network. Please check your connection."
      action={onRetry ? {
        label: 'Retry',
        onClick: onRetry,
      } : undefined}
    />
  );
}
