'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useAccountType, useKycStatus, upgradeAccountType } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Rocket,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Users,
  Coins,
  Crown,
  Video,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ExternalLink,
  Activity,
  Flame,
  Clock,
  Star,
  Loader2,
} from 'lucide-react';
import { StaffBadge } from '@/components/badges/staff-badge';

interface DashboardProps {
  onUpgrade?: (accountType: 'TRADER' | 'CREATOR') => Promise<void>;
  isUpgrading?: boolean;
}

// Social Dashboard - Browse & Engage features
function SocialDashboard({ onUpgrade, isUpgrading }: DashboardProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>Social Explorer</CardTitle>
              <CardDescription>Discover and engage with the XFERNO community</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            As a Social member, you can explore all tokens, follow creators, and participate in discussions.
            Upgrade to Trader to start buying and selling tokens!
          </p>
          <div className="flex gap-3">
            <Link href="/tokens">
              <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90">
                <Eye className="mr-2 h-4 w-4" />
                Explore Tokens
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                Upgrade Account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 hover:border-blue-500/30 transition-colors">
          <CardContent className="pt-6">
            <Eye className="h-8 w-8 text-blue-500 mb-3" />
            <h3 className="font-semibold mb-1">View Tokens</h3>
            <p className="text-sm text-muted-foreground">Browse all launched tokens and their performance</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 hover:border-blue-500/30 transition-colors">
          <CardContent className="pt-6">
            <Heart className="h-8 w-8 text-pink-500 mb-3" />
            <h3 className="font-semibold mb-1">Follow Creators</h3>
            <p className="text-sm text-muted-foreground">Stay updated with your favorite token creators</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 hover:border-blue-500/30 transition-colors">
          <CardContent className="pt-6">
            <MessageCircle className="h-8 w-8 text-green-500 mb-3" />
            <h3 className="font-semibold mb-1">Join Discussions</h3>
            <p className="text-sm text-muted-foreground">Engage in token communities and chat</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 hover:border-blue-500/30 transition-colors">
          <CardContent className="pt-6">
            <Users className="h-8 w-8 text-purple-500 mb-3" />
            <h3 className="font-semibold mb-1">Community</h3>
            <p className="text-sm text-muted-foreground">Connect with other XFERNO members</p>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade CTA */}
      <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-amber-500/5">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/10">
                <TrendingUp className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold">Want to trade tokens?</h3>
                <p className="text-sm text-muted-foreground">Upgrade to a Trader account to buy and sell tokens</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
              onClick={() => onUpgrade?.('TRADER')}
              disabled={isUpgrading}
            >
              {isUpgrading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Upgrade to Trader
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Trader Dashboard - Buy & Sell features
function TraderDashboard({ onUpgrade, isUpgrading }: DashboardProps) {
  const { isVerified, isPending } = useKycStatus();

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-amber-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>Trader Dashboard</CardTitle>
              <CardDescription>Buy, sell, and track your token investments</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isVerified ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-4">
              {isPending ? (
                <>
                  <Shield className="h-5 w-5 text-yellow-500" />
                  <span className="text-yellow-400">Your KYC verification is being reviewed...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-5 w-5 text-yellow-500" />
                  <span className="text-yellow-400">Complete KYC verification to enable trading</span>
                  <Link href="/kyc" className="ml-auto">
                    <Button size="sm" variant="outline" className="border-yellow-500/30 text-yellow-500">
                      Verify Now
                    </Button>
                  </Link>
                </>
              )}
            </div>
          ) : null}
          <div className="flex gap-3">
            <Link href="/tokens">
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90">
                <Coins className="mr-2 h-4 w-4" />
                Trade Tokens
              </Button>
            </Link>
            <Link href="/portfolio">
              <Button variant="outline">
                <Wallet className="mr-2 h-4 w-4" />
                View Portfolio
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Portfolio Value</span>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">$0.00</p>
            <p className="text-xs text-green-500 flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +0.00% today
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Trades</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Tokens Held</span>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground mt-1">Unique tokens</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Win Rate</span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">--</p>
            <p className="text-xs text-muted-foreground mt-1">No trades yet</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-border/50 hover:border-orange-500/30 transition-colors cursor-pointer group">
          <Link href="/tokens">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Flame className="h-8 w-8 text-orange-500 mb-3" />
                  <h3 className="font-semibold mb-1">Hot Tokens</h3>
                  <p className="text-sm text-muted-foreground">Discover trending tokens</p>
                </div>
                <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="border-border/50 hover:border-orange-500/30 transition-colors cursor-pointer group">
          <Link href="/tokens">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Clock className="h-8 w-8 text-blue-500 mb-3" />
                  <h3 className="font-semibold mb-1">New Launches</h3>
                  <p className="text-sm text-muted-foreground">Recently launched tokens</p>
                </div>
                <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="border-border/50 hover:border-orange-500/30 transition-colors cursor-pointer group">
          <Link href="/tokens">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Star className="h-8 w-8 text-yellow-500 mb-3" />
                  <h3 className="font-semibold mb-1">Graduating Soon</h3>
                  <p className="text-sm text-muted-foreground">Tokens near graduation</p>
                </div>
                <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-yellow-500 transition-colors" />
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Upgrade CTA */}
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/10">
                <Rocket className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold">Want to launch your own token?</h3>
                <p className="text-sm text-muted-foreground">Upgrade to a Creator account to launch tokens</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="border-purple-500/30 text-purple-500 hover:bg-purple-500/10"
              onClick={() => onUpgrade?.('CREATOR')}
              disabled={isUpgrading}
            >
              {isUpgrading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Upgrade to Creator
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Creator Dashboard - Launch & Build features
function CreatorDashboard() {
  const { isVerified, isPending } = useKycStatus();

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>Creator Studio</CardTitle>
              <CardDescription>Launch tokens, build communities, and grow your brand</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isVerified ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-4">
              {isPending ? (
                <>
                  <Shield className="h-5 w-5 text-yellow-500" />
                  <span className="text-yellow-400">Your KYC verification is being reviewed...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-5 w-5 text-yellow-500" />
                  <span className="text-yellow-400">Complete KYC verification to launch tokens</span>
                  <Link href="/kyc" className="ml-auto">
                    <Button size="sm" variant="outline" className="border-yellow-500/30 text-yellow-500">
                      Verify Now
                    </Button>
                  </Link>
                </>
              )}
            </div>
          ) : null}
          <div className="flex gap-3">
            <Link href="/launch">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" />
                Launch New Token
              </Button>
            </Link>
            <Link href="/portfolio">
              <Button variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                My Tokens
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Tokens Created</span>
              <Rocket className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Raised</span>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">0 ETH</p>
            <p className="text-xs text-muted-foreground mt-1">Across all tokens</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Graduated</span>
              <Star className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground mt-1">Successful launches</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Followers</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground mt-1">Community members</p>
          </CardContent>
        </Card>
      </div>

      {/* Creator Features */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 hover:border-purple-500/30 transition-colors cursor-pointer group">
          <Link href="/launch">
            <CardContent className="pt-6">
              <Rocket className="h-8 w-8 text-purple-500 mb-3" />
              <h3 className="font-semibold mb-1">Launch Tokens</h3>
              <p className="text-sm text-muted-foreground">Create and deploy new tokens</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="border-border/50 hover:border-purple-500/30 transition-colors">
          <CardContent className="pt-6">
            <Crown className="h-8 w-8 text-yellow-500 mb-3" />
            <h3 className="font-semibold mb-1">Create Groups</h3>
            <p className="text-sm text-muted-foreground">Build public or private communities</p>
            <Badge variant="outline" className="mt-2">Coming Soon</Badge>
          </CardContent>
        </Card>
        <Card className="border-border/50 hover:border-purple-500/30 transition-colors">
          <CardContent className="pt-6">
            <Video className="h-8 w-8 text-red-500 mb-3" />
            <h3 className="font-semibold mb-1">Live Streams</h3>
            <p className="text-sm text-muted-foreground">Engage with your community live</p>
            <Badge variant="outline" className="mt-2">Coming Soon</Badge>
          </CardContent>
        </Card>
        <Card className="border-border/50 hover:border-purple-500/30 transition-colors cursor-pointer group">
          <Link href="/tokens">
            <CardContent className="pt-6">
              <TrendingUp className="h-8 w-8 text-green-500 mb-3" />
              <h3 className="font-semibold mb-1">Trade Tokens</h3>
              <p className="text-sm text-muted-foreground">Buy and sell on the market</p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Recent Activity Placeholder */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Your latest token launches and trades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No recent activity</p>
            <p className="text-sm text-muted-foreground/70">Launch your first token to get started!</p>
            <Link href="/launch" className="mt-4">
              <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" />
                Launch Token
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-4" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-8 mb-3" />
              <Skeleton className="h-5 w-24 mb-1" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const { accountType, isSocial, isTrader, isCreator } = useAccountType();
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  // Handle account upgrade
  const handleUpgrade = async (newAccountType: 'TRADER' | 'CREATOR') => {
    setIsUpgrading(true);
    try {
      const result = await upgradeAccountType(newAccountType);
      toast.success(result.message);
      
      // Refresh user data to get updated account type
      await refreshUser();
      
      if (result.requiresKyc) {
        toast.info('Please complete KYC verification to access all features', {
          action: {
            label: 'Start KYC',
            onClick: () => router.push('/kyc'),
          },
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upgrade account');
    } finally {
      setIsUpgrading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Get icon for account type
  const getAccountIcon = () => {
    if (isCreator) return <Rocket className="h-4 w-4" />;
    if (isTrader) return <TrendingUp className="h-4 w-4" />;
    return <Users className="h-4 w-4" />;
  };

  return (
    <div className="container py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.displayName || user?.username || 'User'}!
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge 
            className={
              isCreator 
                ? 'bg-purple-500/10 border-purple-500/50 text-purple-400 hover:bg-purple-500/20' 
                : isTrader 
                ? 'bg-orange-500/10 border-orange-500/50 text-orange-400 hover:bg-orange-500/20' 
                : 'bg-blue-500/10 border-blue-500/50 text-blue-400 hover:bg-blue-500/20'
            }
          >
            {getAccountIcon()}
            <span className="ml-1.5">{accountType || 'SOCIAL'} Account</span>
          </Badge>
          {user?.kycStatus === 'VERIFIED' && (
            <Badge className="bg-green-500/10 border-green-500/50 text-green-400 hover:bg-green-500/20">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          {user?.kycStatus === 'PENDING' && (
            <Badge className="bg-yellow-500/10 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20">
              <Shield className="h-3 w-3 mr-1" />
              KYC Pending
            </Badge>
          )}
          {(user?.kycStatus === 'NONE' || user?.kycStatus === 'REJECTED') && (isTrader || isCreator) && (
            <Badge className="bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20">
              <ShieldAlert className="h-3 w-3 mr-1" />
              KYC Required
            </Badge>
          )}
          {user?.id && <StaffBadge userId={user.id} size="sm" />}
        </div>
      </div>

      {/* Account-specific Dashboard */}
      {isSocial && <SocialDashboard onUpgrade={handleUpgrade} isUpgrading={isUpgrading} />}
      {isTrader && <TraderDashboard onUpgrade={handleUpgrade} isUpgrading={isUpgrading} />}
      {isCreator && <CreatorDashboard />}
    </div>
  );
}
