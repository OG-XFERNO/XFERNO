'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useAccountType } from '@/lib/auth';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { formatEther, type Address } from 'viem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserTrades, useWatchlist, useTrendingTokens, type Trade, type WatchlistItem, addToWatchlist, removeFromWatchlist } from '@/lib/api/trading';
import { useTokenInfo, useTokenBalance, useCurrentPrice, getExplorerTxUrl, isChainSupported } from '@/lib/contracts';
import { toast } from 'sonner';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  StarOff,
  Coins,
  Activity,
  BarChart3,
  Eye,
  Flame,
  Plus,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

// Token holding with balance
interface TokenHolding {
  address: Address;
  symbol: string;
  name: string;
  balance: bigint;
  price: number;
  value: number;
  change24h: number;
}

// Helper to format numbers
function formatNumber(num: number, decimals = 2): string {
  if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
  return num.toFixed(decimals);
}

function formatPrice(price: number): string {
  if (price === 0) return '0';
  if (price < 0.000001) return price.toFixed(12).replace(/\.?0+$/, '');
  if (price < 0.001) return price.toFixed(9).replace(/\.?0+$/, '');
  if (price < 1) return price.toFixed(6).replace(/\.?0+$/, '');
  return price.toFixed(4);
}

// Trade row component
function TradeRow({ trade, chainId }: { trade: Trade; chainId: number }) {
  const isBuy = trade.tradeType === 'BUY';
  const explorerUrl = getExplorerTxUrl(chainId, trade.txHash);
  const ethAmount = parseFloat(trade.ethAmount) / 1e18;
  const tokenAmount = parseFloat(trade.tokenAmount) / 1e18;
  const price = parseFloat(trade.pricePerToken);

  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isBuy ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          {isBuy ? (
            <ArrowDownRight className="h-4 w-4 text-green-500" />
          ) : (
            <ArrowUpRight className="h-4 w-4 text-red-500" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isBuy ? 'text-green-500' : 'text-red-500'}`}>
              {isBuy ? 'Buy' : 'Sell'}
            </span>
            <span className="text-sm text-muted-foreground">
              {formatNumber(tokenAmount, 4)} tokens
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(trade.blockTimestamp).toLocaleString()}
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium">{ethAmount.toFixed(6)} ETH</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-mono">{trade.tokenAddress.slice(0, 6)}...{trade.tokenAddress.slice(-4)}</span>
          {explorerUrl && (
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Watchlist item component
function WatchlistItemRow({ 
  item, 
  chainId, 
  onRemove 
}: { 
  item: WatchlistItem; 
  chainId: number;
  onRemove: (tokenAddress: string) => void;
}) {
  const tokenInfo = useTokenInfo(item.tokenAddress as Address);
  const { data: price } = useCurrentPrice(item.tokenAddress as Address);
  const priceNum = price ? parseFloat(formatEther(price)) : 0;

  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <Link href={`/trade?token=${item.tokenAddress}`} className="flex items-center gap-3 flex-1 hover:opacity-80">
        <div className="w-10 h-10 rounded-full bg-gradient-fire flex items-center justify-center text-white font-bold text-sm">
          {tokenInfo.symbol?.slice(0, 2) || '??'}
        </div>
        <div>
          <p className="font-medium">{tokenInfo.name || 'Loading...'}</p>
          <p className="text-sm text-muted-foreground">{tokenInfo.symbol || '...'}</p>
        </div>
      </Link>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-medium">{formatPrice(priceNum)} ETH</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-yellow-500 hover:text-yellow-600"
          onClick={() => onRemove(item.tokenAddress)}
        >
          <Star className="h-4 w-4 fill-current" />
        </Button>
      </div>
    </div>
  );
}

// Trending token component
function TrendingTokenRow({ 
  token, 
  index,
  isWatched,
  onToggleWatch,
}: { 
  token: any; 
  index: number;
  isWatched: boolean;
  onToggleWatch: () => void;
}) {
  const tokenInfo = useTokenInfo(token.tokenAddress as Address);
  const priceNum = parseFloat(token.currentPrice);
  const change = token.priceChange24h;

  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold text-muted-foreground w-6">#{index + 1}</span>
        <Link href={`/trade?token=${token.tokenAddress}`} className="flex items-center gap-3 hover:opacity-80">
          <div className="w-10 h-10 rounded-full bg-gradient-fire flex items-center justify-center text-white font-bold text-sm">
            {tokenInfo.symbol?.slice(0, 2) || '??'}
          </div>
          <div>
            <p className="font-medium">{tokenInfo.name || 'Loading...'}</p>
            <p className="text-sm text-muted-foreground">{tokenInfo.symbol || '...'}</p>
          </div>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-medium">{formatPrice(priceNum)} ETH</p>
          <Badge variant={change >= 0 ? 'success' : 'destructive'} className="text-xs">
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${isWatched ? 'text-yellow-500' : 'text-muted-foreground'}`}
          onClick={onToggleWatch}
        >
          {isWatched ? (
            <Star className="h-4 w-4 fill-current" />
          ) : (
            <StarOff className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { canTrade } = useAccountType();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: ethBalance, refetch: refetchBalance } = useBalance({ address });
  const chainSupported = isChainSupported(chainId);

  const [activeTab, setActiveTab] = useState('holdings');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch user data
  const { data: userTrades, isLoading: tradesLoading, refetch: refetchTrades } = useUserTrades(chainId);
  const { data: watchlist, isLoading: watchlistLoading, refetch: refetchWatchlist } = useWatchlist(chainId);
  const { data: trending, isLoading: trendingLoading } = useTrendingTokens(chainId, 10);

  // Calculate portfolio stats from trades
  const portfolioStats = {
    totalTrades: userTrades?.length || 0,
    totalBuys: userTrades?.filter(t => t.tradeType === 'BUY').length || 0,
    totalSells: userTrades?.filter(t => t.tradeType === 'SELL').length || 0,
    totalVolume: userTrades?.reduce((sum, t) => sum + parseFloat(t.ethAmount) / 1e18, 0) || 0,
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchBalance(),
      refetchTrades(),
      refetchWatchlist(),
    ]);
    setIsRefreshing(false);
    toast.success('Portfolio refreshed');
  };

  const handleRemoveFromWatchlist = async (tokenAddress: string) => {
    try {
      await removeFromWatchlist(tokenAddress, chainId);
      refetchWatchlist();
      toast.success('Removed from watchlist');
    } catch (error) {
      toast.error('Failed to remove from watchlist');
    }
  };

  const handleToggleWatch = async (tokenAddress: string, isWatched: boolean) => {
    try {
      if (isWatched) {
        await removeFromWatchlist(tokenAddress, chainId);
      } else {
        await addToWatchlist(tokenAddress, chainId);
      }
      refetchWatchlist();
      toast.success(isWatched ? 'Removed from watchlist' : 'Added to watchlist');
    } catch (error) {
      toast.error('Failed to update watchlist');
    }
  };

  if (authLoading) {
    return (
      <div className="container py-8">
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-6 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view your portfolio and trading history.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!canTrade) {
    return (
      <div className="container py-8">
        <Card className="max-w-lg mx-auto border-orange-500/20 bg-orange-500/5">
          <CardHeader className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-orange-500 mb-4" />
            <CardTitle>Trader Account Required</CardTitle>
            <CardDescription>
              Upgrade to a Trader or Creator account to access portfolio features.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/dashboard">
              <Button className="bg-gradient-fire hover:opacity-90">
                Upgrade Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
          <p className="text-muted-foreground">
            Track your holdings, trades, and watchlist.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">ETH Balance</span>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">
              {ethBalance ? parseFloat(formatEther(ethBalance.value)).toFixed(4) : '0.0000'}
            </p>
            {address && (
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Trades</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{portfolioStats.totalTrades}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {portfolioStats.totalBuys} buys • {portfolioStats.totalSells} sells
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Volume</span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{formatNumber(portfolioStats.totalVolume, 4)}</p>
            <p className="text-xs text-muted-foreground mt-1">ETH traded</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Watchlist</span>
              <Star className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold">{watchlist?.length || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">tokens tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="holdings" className="gap-2">
            <Coins className="h-4 w-4" />
            Holdings
          </TabsTrigger>
          <TabsTrigger value="trades" className="gap-2">
            <Activity className="h-4 w-4" />
            Trade History
          </TabsTrigger>
          <TabsTrigger value="watchlist" className="gap-2">
            <Star className="h-4 w-4" />
            Watchlist
          </TabsTrigger>
          <TabsTrigger value="trending" className="gap-2">
            <Flame className="h-4 w-4" />
            Trending
          </TabsTrigger>
        </TabsList>

        {/* Holdings Tab */}
        <TabsContent value="holdings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Token Holdings
              </CardTitle>
              <CardDescription>
                Your XFERNO token balances. Connect your wallet to see holdings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isConnected ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Connect Wallet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your wallet to view token holdings.
                  </p>
                </div>
              ) : !chainSupported ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Unsupported Network</h3>
                  <p className="text-sm text-muted-foreground">
                    Switch to Sepolia or Base Sepolia to view holdings.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Coins className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Tokens Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start trading to build your portfolio.
                  </p>
                  <Link href="/tokens">
                    <Button className="bg-gradient-fire hover:opacity-90">
                      <Eye className="mr-2 h-4 w-4" />
                      Explore Tokens
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trade History Tab */}
        <TabsContent value="trades">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Trade History
              </CardTitle>
              <CardDescription>
                Your recent trades on XFERNO.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tradesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : userTrades && userTrades.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {userTrades.map(trade => (
                    <TradeRow key={trade.id} trade={trade} chainId={chainId} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Trades Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your trading activity will appear here.
                  </p>
                  <Link href="/tokens">
                    <Button variant="outline">
                      Start Trading
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Watchlist Tab */}
        <TabsContent value="watchlist">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Watchlist
              </CardTitle>
              <CardDescription>
                Tokens you're tracking. Click the star on any token to add it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {watchlistLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : watchlist && watchlist.length > 0 ? (
                <div>
                  {watchlist.map(item => (
                    <WatchlistItemRow 
                      key={item.id} 
                      item={item} 
                      chainId={chainId}
                      onRemove={handleRemoveFromWatchlist}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Star className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Tokens Watched</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add tokens to your watchlist to track them here.
                  </p>
                  <Link href="/tokens">
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Browse Tokens
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trending Tab */}
        <TabsContent value="trending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Trending Tokens
              </CardTitle>
              <CardDescription>
                Top performing tokens by volume and activity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trendingLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-6 w-6" />
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : trending && trending.length > 0 ? (
                <div>
                  {trending.map((token, index) => (
                    <TrendingTokenRow 
                      key={token.tokenAddress} 
                      token={token} 
                      index={index}
                      isWatched={watchlist?.some(w => w.tokenAddress.toLowerCase() === token.tokenAddress.toLowerCase()) || false}
                      onToggleWatch={() => handleToggleWatch(
                        token.tokenAddress,
                        watchlist?.some(w => w.tokenAddress.toLowerCase() === token.tokenAddress.toLowerCase()) || false
                      )}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Flame className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Trending Tokens</h3>
                  <p className="text-sm text-muted-foreground">
                    Trending tokens will appear here as trading activity increases.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
