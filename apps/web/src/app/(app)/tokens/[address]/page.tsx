'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TradingChart } from '@/components/trading/chart';
import { RecentTrades } from '@/components/trading/recent-trades';
import {
  ArrowUpRight,
  Copy,
  Check,
  Globe,
  Twitter,
  MessageCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Coins,
  BarChart3,
  Shield,
  Clock,
  ExternalLink,
  Share2,
  Heart,
  AlertTriangle,
} from 'lucide-react';

// Mock token data - replace with real API call
const mockTokenData = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  name: 'Example Token',
  symbol: 'EXMPL',
  description: 'A revolutionary token built on XFERNO\'s bonding curve mechanism. This project aims to create a fair and transparent token launch platform for the community.',
  logoUrl: null,
  price: 0.00042,
  priceChange24h: 12.5,
  priceChange7d: 45.2,
  volume24h: 125000,
  marketCap: 420000,
  liquidity: 85000,
  holders: 1234,
  totalSupply: 1000000000,
  circulatingSupply: 750000000,
  createdAt: new Date('2024-01-15'),
  creator: '0xabcd...1234',
  bondingProgress: 68,
  website: 'https://example.com',
  twitter: '@exampletoken',
  telegram: 't.me/exampletoken',
  discord: 'discord.gg/example',
  audit: null,
};

export default function TokenDetailPage() {
  const params = useParams();
  const [copied, setCopied] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  const token = mockTokenData;

  const copyAddress = async () => {
    await navigator.clipboard.writeText(token.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container py-6 max-w-7xl">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-border/50 mb-8">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="relative p-4 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            {/* Token Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-fire flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold text-white shadow-lg flex-shrink-0">
                {token.symbol.slice(0, 2)}
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{token.name}</h1>
                  <Badge variant="outline" className="text-sm sm:text-lg">
                    ${token.symbol}
                  </Badge>
                </div>

                {/* Price */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 mb-4">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold">${token.price.toFixed(6)}</span>
                  <div className="flex gap-2">
                    <Badge
                      variant={token.priceChange24h >= 0 ? 'success' : 'destructive'}
                      className="gap-1"
                    >
                      {token.priceChange24h >= 0 ? (
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                      {token.priceChange24h.toFixed(2)}%
                    </Badge>
                    <Badge variant="outline" className="gap-1 hidden sm:flex">
                      {token.priceChange7d >= 0 ? '+' : ''}
                      {token.priceChange7d.toFixed(2)}% (7d)
                    </Badge>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-muted-foreground">
                  <span className="font-mono">{token.address.slice(0, 6)}...{token.address.slice(-4)}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                    <a href={`https://etherscan.io/token/${token.address}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
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
              <Link href={`/trade?token=${token.address}`}>
                <Button className="bg-gradient-fire hover:opacity-90 gap-2">
                  Trade Now
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex flex-wrap gap-3 mt-6">
            {token.website && (
              <Button variant="outline" size="sm" asChild className="gap-2">
                <a href={token.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              </Button>
            )}
            {token.twitter && (
              <Button variant="outline" size="sm" asChild className="gap-2">
                <a href={`https://twitter.com/${token.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-4 w-4" />
                  Twitter
                </a>
              </Button>
            )}
            {token.telegram && (
              <Button variant="outline" size="sm" asChild className="gap-2">
                <a href={`https://${token.telegram}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  Telegram
                </a>
              </Button>
            )}
            {token.discord && (
              <Button variant="outline" size="sm" asChild className="gap-2">
                <a href={`https://${token.discord}`} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4" />
                  Discord
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
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
              <TrendingUp className="h-4 w-4" />
              24h Volume
            </div>
            <p className="text-xl font-bold">${formatNumber(token.volume24h)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Coins className="h-4 w-4" />
              Liquidity
            </div>
            <p className="text-xl font-bold">${formatNumber(token.liquidity)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Users className="h-4 w-4" />
              Holders
            </div>
            <p className="text-xl font-bold">{formatNumber(token.holders, 0)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Coins className="h-4 w-4" />
              Total Supply
            </div>
            <p className="text-xl font-bold">{formatNumber(token.totalSupply, 0)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Clock className="h-4 w-4" />
              Created
            </div>
            <p className="text-xl font-bold">{formatDate(token.createdAt)}</p>
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
            When the bonding curve reaches 100%, liquidity will be automatically added to DEX
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-bold text-gradient-fire">{token.bondingProgress}%</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-fire rounded-full transition-all duration-500"
                style={{ width: `${token.bondingProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$0</span>
              <span>Target: $100K Liquidity</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Chart & Description */}
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

          {/* About */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>About {token.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{token.description}</p>

              <div className="mt-6 pt-6 border-t border-border/50">
                <h4 className="font-medium mb-4">Token Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Contract</span>
                    <p className="font-mono text-xs mt-1">{token.address}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Creator</span>
                    <p className="font-mono text-xs mt-1">{token.creator}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Circulating Supply</span>
                    <p className="font-medium mt-1">{formatNumber(token.circulatingSupply)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Supply</span>
                    <p className="font-medium mt-1">{formatNumber(token.totalSupply)}</p>
                  </div>
                </div>
              </div>

              {!token.audit && (
                <div className="mt-6 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <h5 className="font-medium text-warning">Not Audited</h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        This token has not been audited. Please do your own research before investing.
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
              <Link href={`/trade?token=${token.address}`} className="block">
                <Button className="w-full bg-success hover:bg-success/90 gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Buy {token.symbol}
                </Button>
              </Link>
              <Link href={`/trade?token=${token.address}&action=sell`} className="block">
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
                <span className="text-muted-foreground">Liquidity Locked</span>
                <Badge variant="success">100%</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Mint Function</span>
                <Badge variant="outline">Disabled</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Audit Status</span>
                <Badge variant="warning">Pending</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
