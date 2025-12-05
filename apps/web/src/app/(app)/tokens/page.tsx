'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Flame,
  Clock,
  Star,
  Filter,
  ArrowUpDown,
  Rocket,
  BarChart3,
  Users,
  Zap,
} from 'lucide-react';

// Mock tokens data
const mockTokens = [
  {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    name: 'Fire Token',
    symbol: 'FIRE',
    price: 0.00042,
    priceChange24h: 125.5,
    volume24h: 850000,
    marketCap: 4200000,
    holders: 5234,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    bondingProgress: 85,
  },
  {
    address: '0x2345678901abcdef2345678901abcdef23456789',
    name: 'Moon Rocket',
    symbol: 'MOON',
    price: 0.00128,
    priceChange24h: 45.2,
    volume24h: 320000,
    marketCap: 1280000,
    holders: 2156,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    bondingProgress: 62,
  },
  {
    address: '0x3456789012abcdef3456789012abcdef34567890',
    name: 'Diamond Hands',
    symbol: 'DIAM',
    price: 0.00089,
    priceChange24h: -12.3,
    volume24h: 180000,
    marketCap: 890000,
    holders: 1823,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    bondingProgress: 45,
  },
  {
    address: '0x4567890123abcdef4567890123abcdef45678901',
    name: 'Ape Together',
    symbol: 'APE',
    price: 0.00234,
    priceChange24h: 78.9,
    volume24h: 520000,
    marketCap: 2340000,
    holders: 3421,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    bondingProgress: 92,
  },
  {
    address: '0x5678901234abcdef5678901234abcdef56789012',
    name: 'Pepe Classic',
    symbol: 'PEPE',
    price: 0.00156,
    priceChange24h: 234.7,
    volume24h: 1250000,
    marketCap: 6780000,
    holders: 8932,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    bondingProgress: 95,
  },
  {
    address: '0x6789012345abcdef6789012345abcdef67890123',
    name: 'Wojak Coin',
    symbol: 'WOJAK',
    price: 0.00067,
    priceChange24h: -5.2,
    volume24h: 95000,
    marketCap: 670000,
    holders: 1234,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    bondingProgress: 38,
  },
];

type SortKey = 'marketCap' | 'volume24h' | 'priceChange24h' | 'createdAt' | 'holders';
type TabValue = 'trending' | 'new' | 'gainers' | 'all';

export default function TokensPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabValue>('trending');
  const [sortKey, setSortKey] = useState<SortKey>('marketCap');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredTokens = useMemo(() => {
    let tokens = [...mockTokens];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tokens = tokens.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.symbol.toLowerCase().includes(query) ||
          t.address.toLowerCase().includes(query)
      );
    }

    // Filter by tab
    switch (activeTab) {
      case 'trending':
        tokens = tokens.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case 'new':
        tokens = tokens.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'gainers':
        tokens = tokens.filter((t) => t.priceChange24h > 0).sort((a, b) => b.priceChange24h - a.priceChange24h);
        break;
      default:
        // Sort by selected key
        tokens = tokens.sort((a, b) => {
          const aVal = a[sortKey] instanceof Date ? (a[sortKey] as Date).getTime() : (a[sortKey] as number);
          const bVal = b[sortKey] instanceof Date ? (b[sortKey] as Date).getTime() : (b[sortKey] as number);
          return sortAsc ? aVal - bVal : bVal - aVal;
        });
    }

    return tokens;
  }, [searchQuery, activeTab, sortKey, sortAsc]);

  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(decimals)}K`;
    return `$${num.toFixed(decimals)}`;
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Explore Tokens</h1>
          <p className="text-muted-foreground">
            Discover and trade the hottest tokens on XFERNO
          </p>
        </div>
        <Link href="/launch">
          <Button className="bg-gradient-fire hover:opacity-90 gap-2">
            <Rocket className="h-4 w-4" />
            Launch Token
          </Button>
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Flame className="h-4 w-4 text-primary" />
              Total Tokens
            </div>
            <p className="text-2xl font-bold">{mockTokens.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <BarChart3 className="h-4 w-4 text-primary" />
              24h Volume
            </div>
            <p className="text-2xl font-bold">
              {formatNumber(mockTokens.reduce((sum, t) => sum + t.volume24h, 0))}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Users className="h-4 w-4 text-primary" />
              Total Holders
            </div>
            <p className="text-2xl font-bold">
              {mockTokens.reduce((sum, t) => sum + t.holders, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Zap className="h-4 w-4 text-primary" />
              New Today
            </div>
            <p className="text-2xl font-bold">
              {mockTokens.filter((t) => Date.now() - t.createdAt.getTime() < 24 * 60 * 60 * 1000).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, symbol, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="trending" className="gap-1 sm:gap-2 flex-1 sm:flex-none">
              <Flame className="h-4 w-4" />
              <span className="hidden sm:inline">Trending</span>
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-1 sm:gap-2 flex-1 sm:flex-none">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </TabsTrigger>
            <TabsTrigger value="gainers" className="gap-1 sm:gap-2 flex-1 sm:flex-none">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Gainers</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-1 sm:gap-2 flex-1 sm:flex-none">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">All</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Token Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">#</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Token</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Price</th>
                <th
                  className="text-right p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort('priceChange24h')}
                >
                  <span className="inline-flex items-center gap-1">
                    24h %
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th
                  className="text-right p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort('volume24h')}
                >
                  <span className="inline-flex items-center gap-1">
                    Volume
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th
                  className="text-right p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort('marketCap')}
                >
                  <span className="inline-flex items-center gap-1">
                    Market Cap
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th
                  className="text-right p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort('holders')}
                >
                  <span className="inline-flex items-center gap-1">
                    Holders
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Progress</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Age</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {filteredTokens.map((token, index) => (
                <tr
                  key={token.address}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="p-4 text-sm text-muted-foreground">{index + 1}</td>
                  <td className="p-4">
                    <Link href={`/tokens/${token.address}`} className="flex items-center gap-3 hover:opacity-80">
                      <div className="w-10 h-10 rounded-full bg-gradient-fire flex items-center justify-center text-white font-bold text-sm">
                        {token.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium">{token.name}</p>
                        <p className="text-sm text-muted-foreground">${token.symbol}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="p-4 text-right font-mono">
                    ${token.price.toFixed(6)}
                  </td>
                  <td className="p-4 text-right">
                    <Badge
                      variant={token.priceChange24h >= 0 ? 'success' : 'destructive'}
                      className="gap-1"
                    >
                      {token.priceChange24h >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(token.priceChange24h).toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="p-4 text-right font-medium">
                    {formatNumber(token.volume24h)}
                  </td>
                  <td className="p-4 text-right font-medium">
                    {formatNumber(token.marketCap)}
                  </td>
                  <td className="p-4 text-right text-muted-foreground">
                    {token.holders.toLocaleString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-fire rounded-full"
                          style={{ width: `${token.bondingProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">
                        {token.bondingProgress}%
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right text-sm text-muted-foreground">
                    {formatTimeAgo(token.createdAt)}
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/trade?token=${token.address}`}>
                      <Button size="sm" className="bg-gradient-fire hover:opacity-90">
                        Trade
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTokens.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">No tokens found matching your criteria</p>
          </div>
        )}
      </Card>
    </div>
  );
}
