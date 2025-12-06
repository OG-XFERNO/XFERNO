'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Network, RefreshCw, Globe, Check, X } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

interface NetworkData {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string | null;
  isEnabled: boolean;
  isTestnet: boolean;
}

export default function AdminNetworksPage() {
  const [networks, setNetworks] = useState<NetworkData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNetworks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('xferno_token');
      const response = await fetch(`${API_BASE}/api/admin/networks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch networks');

      const data = await response.json();
      setNetworks(data);
    } catch (err) {
      toast.error('Failed to load networks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworks();
  }, []);

  const toggleNetwork = async (networkId: string, isEnabled: boolean) => {
    try {
      const token = localStorage.getItem('xferno_token');
      const response = await fetch(`${API_BASE}/api/admin/networks/${networkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isEnabled }),
      });

      if (!response.ok) throw new Error('Failed to update network');

      toast.success(`Network ${isEnabled ? 'enabled' : 'disabled'}`);
      fetchNetworks();
    } catch (err) {
      toast.error('Failed to update network');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Network Management</h1>
          <p className="text-muted-foreground">Manage supported blockchain networks</p>
        </div>
        <Button variant="outline" onClick={fetchNetworks}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-24 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : networks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No networks configured</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {networks.map((network) => (
            <Card key={network.id} className={!network.isEnabled ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    {network.name}
                  </CardTitle>
                  <Switch
                    checked={network.isEnabled}
                    onCheckedChange={(checked) => toggleNetwork(network.id, checked)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Chain ID</span>
                    <Badge variant="outline">{network.chainId}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <Badge variant={network.isTestnet ? 'secondary' : 'default'}>
                      {network.isTestnet ? 'Testnet' : 'Mainnet'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {network.isEnabled ? (
                      <Badge variant="success" className="flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <X className="h-3 w-3" />
                        Disabled
                      </Badge>
                    )}
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground truncate" title={network.rpcUrl}>
                      RPC: {network.rpcUrl}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
