'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut, Check, Loader2 } from 'lucide-react';
import { chainMetadata } from '@/lib/wagmi';
import { Skeleton } from '@/components/ui/skeleton';

export function ConnectButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect, isPending: isDisconnecting } = useDisconnect();
  const { data: balance, isLoading: isBalanceLoading } = useBalance({ address });
  const chainId = useChainId();
  const { chains, switchChain, isPending: isSwitchingChain } = useSwitchChain();

  const isLoading = isConnecting || isReconnecting;

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentChain = chainMetadata[chainId];

  // Show loading skeleton while reconnecting
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-32" />
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        {/* Chain Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2" disabled={isSwitchingChain}>
              {isSwitchingChain ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span>{currentChain?.icon || '🔗'}</span>
              )}
              <span className="hidden sm:inline">{currentChain?.name || 'Unknown'}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Switch Network</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {chains.map((chain) => (
              <DropdownMenuItem
                key={chain.id}
                onClick={() => switchChain({ chainId: chain.id })}
                className="gap-2"
              >
                <span>{chainMetadata[chain.id]?.icon || '🔗'}</span>
                <span>{chain.name}</span>
                {chain.id === chainId && <Check className="h-4 w-4 ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Account Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Wallet className="h-4 w-4" />
              <span>{formatAddress(address)}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{formatAddress(address)}</p>
                <p className="text-xs text-muted-foreground">
                  {isBalanceLoading ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading balance...
                    </span>
                  ) : balance ? (
                    `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}`
                  ) : (
                    'Unable to load balance'
                  )}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={copyAddress} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Address'}
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-2">
              <a
                href={`https://etherscan.io/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                View on Explorer
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => disconnect()}
              disabled={isDisconnecting}
              className="gap-2 text-destructive focus:text-destructive"
            >
              {isDisconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="sm"
        className="bg-gradient-fire hover:opacity-90"
      >
        <Wallet className="h-4 w-4 mr-2" />
        Connect Wallet
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>
              Choose your preferred wallet to connect to XFERNO
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {connectors.map((connector) => {
              const isConnecting = connectingId === connector.uid;
              return (
                <Button
                  key={connector.uid}
                  variant="outline"
                  className="w-full justify-start gap-3 h-14"
                  disabled={isPending}
                  onClick={() => {
                    setConnectingId(connector.uid);
                    connect(
                      { connector },
                      {
                        onSuccess: () => {
                          setConnectingId(null);
                          setIsOpen(false);
                        },
                        onError: () => {
                          setConnectingId(null);
                        },
                      }
                    );
                  }}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      {isConnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wallet className="h-4 w-4" />
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium">{connector.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {isConnecting ? 'Connecting...' : connector.type === 'injected' ? 'Browser Wallet' : 'External'}
                      </div>
                    </div>
                    {isConnecting && (
                      <div className="text-xs text-muted-foreground">
                        Check wallet...
                      </div>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
