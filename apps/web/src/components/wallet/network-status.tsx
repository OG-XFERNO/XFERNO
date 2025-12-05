'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { sepolia, baseSepolia } from 'wagmi/chains';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { isChainSupported, areContractsDeployed } from '@/lib/contracts';
import {
  Wifi,
  WifiOff,
  ChevronDown,
  Check,
  AlertTriangle,
  Zap,
} from 'lucide-react';

const SUPPORTED_CHAINS = [
  { id: sepolia.id, name: 'Sepolia', icon: '🔷', deployed: true },
  { id: baseSepolia.id, name: 'Base Sepolia', icon: '🔵', deployed: false },
];

export function NetworkStatus() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-28 bg-muted rounded-lg animate-pulse" />
    );
  }

  if (!isConnected) {
    return (
      <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
        <WifiOff className="w-3 h-3" />
        <span className="hidden sm:inline">Disconnected</span>
      </Badge>
    );
  }

  const currentChain = SUPPORTED_CHAINS.find(c => c.id === chainId);
  const isSupported = isChainSupported(chainId);
  const hasContracts = areContractsDeployed(chainId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${!isSupported ? 'border-destructive text-destructive' : ''}`}
          disabled={isPending}
        >
          {isPending ? (
            <Zap className="w-4 h-4 animate-pulse" />
          ) : isSupported ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {currentChain?.name || 'Unknown Network'}
          </span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select Network</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SUPPORTED_CHAINS.map((chain) => (
          <DropdownMenuItem
            key={chain.id}
            onClick={() => switchChain({ chainId: chain.id })}
            className="gap-2 cursor-pointer"
          >
            <span>{chain.icon}</span>
            <span className="flex-1">{chain.name}</span>
            {chain.id === chainId && (
              <Check className="w-4 h-4 text-green-500" />
            )}
            {chain.deployed && (
              <Badge variant="success" className="text-xs py-0 px-1.5">
                Live
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
        {!isSupported && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              Current network not supported
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact network badge for inline use
export function NetworkBadge() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isConnected) return null;

  const isSupported = isChainSupported(chainId);
  const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);

  if (!isSupported) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="w-3 h-3" />
        Wrong Network
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1">
      <span className="w-2 h-2 rounded-full bg-green-500" />
      {chain?.name || 'Connected'}
    </Badge>
  );
}
