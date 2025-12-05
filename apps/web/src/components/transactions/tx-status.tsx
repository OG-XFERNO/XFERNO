'use client';

import { useState, useEffect } from 'react';
import { useChainId } from 'wagmi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getExplorerTxUrl } from '@/lib/contracts';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Clock,
  Zap,
} from 'lucide-react';

export type TxStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

interface TxStatusProps {
  status: TxStatus;
  hash?: string;
  error?: Error | null;
  title?: string;
  successMessage?: string;
  onDismiss?: () => void;
  className?: string;
}

export function TxStatusCard({
  status,
  hash,
  error,
  title = 'Transaction',
  successMessage = 'Transaction confirmed!',
  onDismiss,
  className = '',
}: TxStatusProps) {
  const chainId = useChainId();
  const explorerUrl = hash ? getExplorerTxUrl(chainId, hash) : null;

  if (status === 'idle') return null;

  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10 border-yellow-500/20',
      label: 'Pending',
      message: 'Please confirm in your wallet...',
    },
    confirming: {
      icon: Loader2,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10 border-blue-500/20',
      label: 'Confirming',
      message: 'Waiting for confirmation...',
    },
    success: {
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-500/10 border-green-500/20',
      label: 'Success',
      message: successMessage,
    },
    error: {
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10 border-red-500/20',
      label: 'Failed',
      message: error?.message?.slice(0, 100) || 'Transaction failed',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className={`${config.bg} border ${className}`}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className={`${config.color} mt-0.5`}>
            {status === 'confirming' ? (
              <Icon className="w-5 h-5 animate-spin" />
            ) : (
              <Icon className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{title}</span>
              <Badge variant="outline" className={`${config.color} text-xs`}>
                {config.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{config.message}</p>
            {hash && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground font-mono">
                  {hash.slice(0, 10)}...{hash.slice(-8)}
                </span>
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs flex items-center gap-1"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>
          {(status === 'success' || status === 'error') && onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact inline status
interface TxStatusInlineProps {
  status: TxStatus;
  hash?: string;
  className?: string;
}

export function TxStatusInline({ status, hash, className = '' }: TxStatusInlineProps) {
  const chainId = useChainId();
  const explorerUrl = hash ? getExplorerTxUrl(chainId, hash) : null;

  if (status === 'idle') return null;

  const icons = {
    pending: <Clock className="w-4 h-4 text-yellow-500" />,
    confirming: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
    success: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    error: <XCircle className="w-4 h-4 text-red-500" />,
  };

  const labels = {
    pending: 'Pending...',
    confirming: 'Confirming...',
    success: 'Confirmed',
    error: 'Failed',
  };

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {icons[status]}
      <span>{labels[status]}</span>
      {explorerUrl && hash && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

// Hook to derive status from wagmi transaction states
export function useTxStatus(
  isPending: boolean,
  isConfirming: boolean,
  isSuccess: boolean,
  error: Error | null | undefined
): TxStatus {
  if (error) return 'error';
  if (isSuccess) return 'success';
  if (isConfirming) return 'confirming';
  if (isPending) return 'pending';
  return 'idle';
}
