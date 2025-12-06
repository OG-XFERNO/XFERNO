'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TokenList, TokenStats, type SortOption } from '@/components/tokens';
import { AuthModal } from '@/components/auth/auth-modal';
import { useAuth } from '@/lib/auth';
import {
  Search,
  TrendingUp,
  Flame,
  Clock,
  Star,
  Rocket,
  Droplets,
  LogIn,
} from 'lucide-react';

type TabValue = 'trending' | 'new' | 'gainers' | 'all';

export default function TokensPage() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabValue>('new');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Map tab to sort option
  const getSortOption = (tab: TabValue): SortOption => {
    switch (tab) {
      case 'trending': return 'liquidity';
      case 'new': return 'new';
      case 'gainers': return 'progress';
      case 'all': return 'new';
      default: return 'new';
    }
  };

  return (
    <div className="container py-8">
      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Explore Tokens</h1>
          <p className="text-muted-foreground">
            Discover and trade the hottest tokens on XFERNO
          </p>
        </div>
        {isAuthenticated ? (
          <Link href="/launch">
            <Button className="bg-gradient-fire hover:opacity-90 gap-2">
              <Rocket className="h-4 w-4" />
              Launch Token
            </Button>
          </Link>
        ) : (
          <Button 
            className="bg-gradient-fire hover:opacity-90 gap-2"
            onClick={() => setAuthModalOpen(true)}
          >
            <LogIn className="h-4 w-4" />
            Login to Trade
          </Button>
        )}
      </div>

      {/* Stats Bar */}
      <div className="mb-8">
        <TokenStats />
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
              <Droplets className="h-4 w-4" />
              <span className="hidden sm:inline">Liquidity</span>
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-1 sm:gap-2 flex-1 sm:flex-none">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </TabsTrigger>
            <TabsTrigger value="gainers" className="gap-1 sm:gap-2 flex-1 sm:flex-none">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-1 sm:gap-2 flex-1 sm:flex-none">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">All</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Token List */}
      <TokenList 
        searchQuery={searchQuery}
        sortBy={getSortOption(activeTab)}
        emptyMessage="No tokens found matching your criteria"
        requireAuth={!isAuthenticated}
        onNeedAuth={() => setAuthModalOpen(true)}
      />
    </div>
  );
}
