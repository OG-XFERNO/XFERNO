'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChainId } from 'wagmi';
import { type Address, formatEther } from 'viem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  useTokenInfo,
  useCurrentPrice,
  useTokenState,
  isChainSupported,
} from '@/lib/contracts';
import { isValidEthAddress } from '@/lib/utils';
import {
  Search,
  ChevronDown,
  Coins,
  TrendingUp,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface TokenSelectorProps {
  selectedToken?: Address;
  onSelect?: (token: Address) => void;
  className?: string;
}

// Recent tokens storage key
const RECENT_TOKENS_KEY = 'xferno_recent_tokens';
const MAX_RECENT_TOKENS = 5;

// Get recent tokens from localStorage
function getRecentTokens(): Address[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_TOKENS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save token to recent tokens
export function addRecentToken(tokenAddress: Address): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getRecentTokens();
    const filtered = current.filter(t => t.toLowerCase() !== tokenAddress.toLowerCase());
    const updated = [tokenAddress, ...filtered].slice(0, MAX_RECENT_TOKENS);
    localStorage.setItem(RECENT_TOKENS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

export function TokenSelector({ selectedToken, onSelect, className }: TokenSelectorProps) {
  const router = useRouter();
  const chainId = useChainId();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchAddress, setSearchAddress] = useState<Address | undefined>();
  const [recentTokens, setRecentTokens] = useState<Address[]>([]);

  // Load recent tokens on mount
  useEffect(() => {
    setRecentTokens(getRecentTokens());
  }, []);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Selected token info
  const selectedTokenInfo = useTokenInfo(selectedToken);
  const { data: selectedPrice } = useCurrentPrice(selectedToken);

  // Search result token info
  const searchTokenInfo = useTokenInfo(searchAddress);
  const { data: searchPrice } = useCurrentPrice(searchAddress);
  const { data: searchState } = useTokenState(searchAddress);

  const chainSupported = isChainSupported(chainId);

  // Handle search input
  useEffect(() => {
    if (isValidEthAddress(search)) {
      setSearchAddress(search as Address);
    } else {
      setSearchAddress(undefined);
    }
  }, [search]);

  // Don't render dialog trigger until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <Button variant="outline" className={`justify-between min-w-[160px] ${className}`} disabled>
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-muted-foreground" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
        <ChevronDown className="w-4 h-4 ml-2 text-muted-foreground" />
      </Button>
    );
  }

  const handleSelect = (token: Address) => {
    // Add to recent tokens
    addRecentToken(token);
    setRecentTokens(getRecentTokens());
    
    if (onSelect) {
      onSelect(token);
    } else {
      router.push(`/trade?token=${token}`);
    }
    setOpen(false);
    setSearch('');
  };

  const selectedSymbol = selectedToken && selectedTokenInfo.symbol 
    ? selectedTokenInfo.symbol 
    : 'Select Token';

  const selectedName = selectedToken && selectedTokenInfo.name
    ? selectedTokenInfo.name
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={`justify-between min-w-[160px] ${className}`}
        >
          <div className="flex items-center gap-2">
            {selectedToken ? (
              <>
                <div className="w-6 h-6 rounded-full bg-gradient-fire flex items-center justify-center text-white text-xs font-bold">
                  {selectedSymbol.slice(0, 2)}
                </div>
                <span className="font-medium">{selectedSymbol}</span>
              </>
            ) : (
              <>
                <Coins className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">Select Token</span>
              </>
            )}
          </div>
          <ChevronDown className="w-4 h-4 ml-2 text-muted-foreground" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select a Token</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Paste token address (0x...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Chain Warning */}
          {!chainSupported && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm">
              <p className="text-yellow-600 dark:text-yellow-500">
                Switch to Sepolia or Base Sepolia to view tokens.
              </p>
            </div>
          )}

          {/* Search Result */}
          {searchAddress && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Search Result</p>
              {searchTokenInfo.isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : searchTokenInfo.name ? (
                <button
                  onClick={() => handleSelect(searchAddress)}
                  className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-fire flex items-center justify-center text-white font-bold">
                        {searchTokenInfo.symbol?.slice(0, 2) || '??'}
                      </div>
                      <div>
                        <p className="font-medium">{searchTokenInfo.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {searchTokenInfo.symbol}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {searchPrice && (
                        <p className="font-medium">
                          ${parseFloat(formatEther(searchPrice)).toFixed(6)}
                        </p>
                      )}
                      {searchState && (
                        <p className="text-sm text-muted-foreground">
                          {parseFloat(formatEther(searchState.ethReserve)).toFixed(2)} ETH
                        </p>
                      )}
                    </div>
                  </div>
                  {searchTokenInfo.graduated && (
                    <Badge variant="success" className="mt-2">
                      Graduated
                    </Badge>
                  )}
                </button>
              ) : (
                <div className="p-3 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
                  Token not found or not an XFERNO token
                </div>
              )}
            </div>
          )}

          {/* Recent Tokens */}
          {recentTokens.length > 0 && !search && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Recent</p>
              <div className="space-y-1">
                {recentTokens.map((token: Address) => (
                  <RecentTokenItem
                    key={token}
                    address={token}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!search && recentTokens.length === 0 && (
            <div className="text-center py-8">
              <Coins className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-2">
                No recent tokens
              </p>
              <p className="text-sm text-muted-foreground">
                Paste a token address above or{' '}
                <a href="/tokens" className="text-primary hover:underline">
                  browse tokens
                </a>
              </p>
            </div>
          )}

          {/* Browse All */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setOpen(false);
              router.push('/tokens');
            }}
          >
            <Search className="w-4 h-4 mr-2" />
            Browse All Tokens
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for recent token items
function RecentTokenItem({ 
  address, 
  onSelect 
}: { 
  address: Address; 
  onSelect: (token: Address) => void;
}) {
  const tokenInfo = useTokenInfo(address);
  const { data: price } = useCurrentPrice(address);

  if (tokenInfo.isLoading) {
    return (
      <div className="p-3 rounded-lg border border-border animate-pulse">
        <div className="h-10 bg-muted rounded" />
      </div>
    );
  }

  if (!tokenInfo.name) return null;

  return (
    <button
      onClick={() => onSelect(address)}
      className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-fire flex items-center justify-center text-white text-sm font-bold">
            {tokenInfo.symbol?.slice(0, 2) || '??'}
          </div>
          <div>
            <p className="font-medium text-sm">{tokenInfo.symbol}</p>
            <p className="text-xs text-muted-foreground">
              {tokenInfo.name}
            </p>
          </div>
        </div>
        {price && (
          <p className="text-sm font-medium">
            ${parseFloat(formatEther(price)).toFixed(6)}
          </p>
        )}
      </div>
    </button>
  );
}
