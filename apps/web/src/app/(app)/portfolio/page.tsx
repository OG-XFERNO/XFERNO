'use client';

import { useAuth } from '@/lib/auth';
import { useAccount, useBalance } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { formatEther } from 'viem';

export default function PortfolioPage() {
  const { user, isAuthenticated } = useAuth();
  const { address, isConnected } = useAccount();
  const { data: ethBalance, refetch } = useBalance({ address });

  if (!isAuthenticated) {
    return (
      <div className="container py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view your portfolio.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
          <p className="text-muted-foreground">
            Track your token holdings and trading activity.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Balance Overview */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>ETH Balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ethBalance ? parseFloat(formatEther(ethBalance.value)).toFixed(4) : '0.0000'} ETH
            </div>
            {isConnected && address && (
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Portfolio Value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground mt-1">
              Coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>24h Change</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500 flex items-center gap-1">
              <TrendingUp className="h-5 w-5" />
              +0.00%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Token Holdings */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Token Holdings
          </CardTitle>
          <CardDescription>
            Your XFERNO token holdings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-4">🪙</div>
            <h3 className="text-lg font-semibold mb-2">No Tokens Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start trading to build your portfolio.
            </p>
            <Button asChild className="bg-gradient-fire hover:opacity-90">
              <Link href="/tokens">Explore Tokens</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your recent trades and transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
            <p className="text-sm text-muted-foreground">
              Your trading activity will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
