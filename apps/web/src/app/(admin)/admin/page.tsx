'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Coins,
  Activity,
  TrendingUp,
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

interface DashboardStats {
  totalUsers: number;
  totalTokens: number;
  totalTrades: number;
  activePresales: number;
  graduatedTokens: number;
  pendingKyc: number;
  verifiedKyc: number;
  totalVolume: string;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const token = localStorage.getItem('xferno_token');
        const response = await fetch(`${API_BASE}/api/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of platform activity</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const formatVolume = (volume: string) => {
    const num = parseFloat(volume) / 1e18;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(4);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of platform activity</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          description="Registered users"
        />
        <StatCard
          title="Total Tokens"
          value={stats?.totalTokens || 0}
          icon={Coins}
          description="Created tokens"
        />
        <StatCard
          title="Total Trades"
          value={stats?.totalTrades || 0}
          icon={Activity}
          description="All-time trades"
        />
        <StatCard
          title="Total Volume"
          value={`${formatVolume(stats?.totalVolume || '0')} ETH`}
          icon={TrendingUp}
          description="Trading volume"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Presales"
          value={stats?.activePresales || 0}
          icon={Clock}
          description="Ongoing presales"
        />
        <StatCard
          title="Graduated Tokens"
          value={stats?.graduatedTokens || 0}
          icon={CheckCircle}
          description="Successfully graduated"
        />
        <StatCard
          title="Pending KYC"
          value={stats?.pendingKyc || 0}
          icon={Clock}
          description="Awaiting verification"
        />
        <StatCard
          title="Verified KYC"
          value={stats?.verifiedKyc || 0}
          icon={ShieldCheck}
          description="Verified users"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common admin tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="pt-6 text-center">
                <Users className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="font-medium">Manage Users</p>
                <p className="text-xs text-muted-foreground">View and edit users</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="pt-6 text-center">
                <ShieldCheck className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="font-medium">Review KYC</p>
                <p className="text-xs text-muted-foreground">{stats?.pendingKyc || 0} pending</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="pt-6 text-center">
                <Coins className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <p className="font-medium">Token Status</p>
                <p className="text-xs text-muted-foreground">Manage tokens</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
