'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { type Address, formatEther } from 'viem';
import { useChainId } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TradingChart } from '@/components/trading/chart';
import { RecentTrades } from '@/components/trading/recent-trades';
import {
  useTokenFullData,
  isChainSupported,
  getExplorerAddressUrl,
  getExplorerTokenUrl,
} from '@/lib/contracts';
import {
  ArrowUpRight,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Coins,
  BarChart3,
  Shield,
  ExternalLink,
  Share2,
  Heart,
  AlertTriangle,
  Zap,
  Droplets,
  ArrowLeft,
  Loader2,
  Globe,
} from 'lucide-react';
import { NETWORK_CONFIG } from '@/components/tokens/token-card';

export default function TokenDetailPage() {
  const params = useParams();
  const chainId = useChainId();
  const chainSupported = isChainSupported(chainId);
  const [copied, setCopied] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [mounted, setMounted] = useState(false);

  const tokenAddress = params.address as Address;
  const { data: token, isLoading, error, refetch } = useTokenFullData(tokenAddress);

  useEffect(() => {
    setMounted(true);
  }, []);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(tokenAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatNumber = (num: number | undefined, decimals = 2) => {
    if (num === undefined) return '-';
    if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

  const price = token?.currentPrice ? Number(formatEther(token.currentPrice)) : 0;
  const totalSupply = token?.totalSupply ? Number(formatEther(token.totalSupply)) : 0;
  const explorerUrl = getExplorerTokenUrl(chainId, tokenAddress);
  
  // Get network info for display
  const network = NETWORK_CONFIG[chainId] || NETWORK_CONFIG[11155111];
  const liquiditySymbol = network?.symbol || 'ETH';

  // Loading state
  if (!mounted || isLoading) {
    return (
      <div className="container py-6 max-w-7xl">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-border/50 mb-8">
          <div className="p-8">
            <div className="flex items-start gap-6">
              <Skeleton className="w-24 h-24 rounded-2xl" />
              <div className="space-y-4">
                <Skeleton className="w-48 h-8" />
                <Skeleton className="w-32 h-10" />
                <Skeleton className="w-64 h-4" />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border/50 bg-card/50">
              <CardContent className="pt-4">
                <Skeleton className="w-20 h-4 mb-2" />
                <Skeleton className="w-24 h-6" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !token) {
    return (
      <div className="container py-6 max-w-7xl">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Token Not Found</h2>
            <p className="text-muted-foreground mb-4">
              Could not load token data. Make sure you're on the correct network.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => refetch()}>
                <Loader2 className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <Link href="/tokens">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Tokens
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Chain not supported
  if (!chainSupported) {
    return (
      <div className="container py-6 max-w-7xl">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Network Not Supported</h2>
            <p className="text-muted-foreground">
              Please switch to Sepolia or Base Sepolia to view this token.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-7xl">
      {/* Back Button */}
      <Link href="/tokens" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Tokens
      </Link>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-border/50 mb-8">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="relative p-4 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            {/* Token Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-fire flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold text-white shadow-lg flex-shrink-0">
                {token.symbol?.slice(0, 2) || '??'}
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{token.name}</h1>
                  <Badge variant="outline" className="text-sm sm:text-lg">
                    ${token.symbol}
                  </Badge>
                  {/* Network Badge */}
                  <Badge 
                    variant="outline" 
                    className="gap-1"
                    style={{ borderColor: network?.color, color: network?.color }}
                  >
                    <span>{network?.icon}</span>
                    {network?.name}
                  </Badge>
                  {token.graduated && (
                    <Badge variant="success" className="gap-1">
                      <Zap className="w-3 h-3" />
                      Graduated
                    </Badge>
                  )}
                </div>

                {/* Price */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 mb-4">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono">
                    ${price.toFixed(8)}
                  </span>
                </div>

                {/* Address */}
                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-muted-foreground">
                  <span className="font-mono">{tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  {explorerUrl && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                      <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsWatchlisted(!isWatchlisted)}
              >
                <Heart className={`h-4 w-4 ${isWatchlisted ? 'fill-destructive text-destructive' : ''}`} />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
              <Link href={`/trade?token=${tokenAddress}`}>
                <Button className="bg-gradient-fire hover:opacity-90 gap-2">
                  Trade Now
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <BarChart3 className="h-4 w-4" />
              Market Cap
            </div>
            <p className="text-xl font-bold">${formatNumber(token.marketCap)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Droplets className="h-4 w-4" />
              Liquidity
            </div>
            <p className="text-xl font-bold">{formatNumber(token.liquidity)} {liquiditySymbol}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Coins className="h-4 w-4" />
              Total Supply
            </div>
            <p className="text-xl font-bold">{formatNumber(totalSupply, 0)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              Progress
            </div>
            <p className="text-xl font-bold">{token.bondingProgress?.toFixed(1) || 0}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Bonding Curve Progress */}
      <Card className="border-border/50 bg-card/50 backdrop-blur mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Bonding Curve Progress
          </CardTitle>
          <CardDescription>
            {token.graduated 
              ? 'This token has graduated! Liquidity has been added to DEX.'
              : 'When the bonding curve reaches 100%, liquidity will be automatically added to DEX'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-bold text-primary">{token.bondingProgress?.toFixed(1) || 0}%</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  token.graduated ? 'bg-green-500' : 'bg-gradient-fire'
                }`}
                style={{ width: `${token.bondingProgress || 0}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 {liquiditySymbol}</span>
              <span>Target: 6.9 {liquiditySymbol}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Chart & Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Price Chart */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Price Chart</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <TradingChart />
            </CardContent>
          </Card>

          {/* Token Details */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Token Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Contract Address</span>
                  <p className="font-mono text-xs mt-1 break-all">{tokenAddress}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Creator</span>
                  <p className="font-mono text-xs mt-1 break-all">{token.creator}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Bonding Curve</span>
                  <p className="font-mono text-xs mt-1 break-all">{token.bondingCurve}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Trading Status</span>
                  <p className="font-medium mt-1">
                    {token.tradingEnabled ? (
                      <Badge variant="success">Enabled</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-yellow-600 dark:text-yellow-500">DYOR</h5>
                    <p className="text-sm text-muted-foreground mt-1">
                      Always do your own research before investing. XFERNO tokens are experimental.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Trading & Activity */}
        <div className="space-y-8">
          {/* Quick Trade Card */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                Quick Trade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href={`/trade?token=${tokenAddress}`} className="block">
                <Button className="w-full bg-success hover:bg-success/90 gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Buy {token.symbol}
                </Button>
              </Link>
              <Link href={`/trade?token=${tokenAddress}`} className="block">
                <Button variant="outline" className="w-full gap-2 border-destructive text-destructive hover:bg-destructive hover:text-white">
                  <TrendingDown className="h-4 w-4" />
                  Sell {token.symbol}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Trades */}
          <RecentTrades />

          {/* Security Info */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Contract Verified</span>
                <Badge variant="success">Yes</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Bonding Curve</span>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Mint Function</span>
                <Badge variant="outline">Curve Only</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                {token.graduated ? (
                  <Badge variant="success">Graduated</Badge>
                ) : (
                  <Badge variant="outline">Bonding</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
