'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Coins, MoreHorizontal, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

interface Token {
  id: string;
  name: string;
  symbol: string;
  address: string;
  chainId: number;
  status: string;
  createdAt: string;
  creator: {
    id: string;
    username: string | null;
    displayName: string | null;
  };
  _count: {
    presaleContributions: number;
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'PRESALE':
      return <Badge variant="warning">Presale</Badge>;
    case 'GRADUATED':
      return <Badge variant="success">Graduated</Badge>;
    case 'FAILED':
      return <Badge variant="destructive">Failed</Badge>;
    case 'PAUSED':
      return <Badge variant="secondary">Paused</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function AdminTokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('xferno_token');
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`${API_BASE}/api/admin/tokens?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch tokens');

      const data = await response.json();
      setTokens(data.tokens);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error('Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [page, statusFilter]);

  const updateTokenStatus = async (tokenId: string, status: string) => {
    try {
      const token = localStorage.getItem('xferno_token');
      const response = await fetch(`${API_BASE}/api/admin/tokens/${tokenId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast.success('Token status updated');
      fetchTokens();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const shortenAddress = (address: string) => 
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Token Management</h1>
        <p className="text-muted-foreground">Manage platform tokens and their status</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="PRESALE">Presale</SelectItem>
                <SelectItem value="GRADUATED">Graduated</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => setStatusFilter('')}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tokens Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Tokens ({tokens.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-8">
              <Coins className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No tokens found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Chain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{token.name}</p>
                          <p className="text-xs text-muted-foreground">{token.symbol}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{shortenAddress(token.address)}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{token.chainId}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(token.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {token.creator?.displayName || token.creator?.username || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(token.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => window.open(`/tokens/${token.address}`, '_blank')}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Token
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateTokenStatus(token.id, 'PAUSED')}
                              disabled={token.status === 'PAUSED'}
                            >
                              Pause Token
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateTokenStatus(token.id, 'PRESALE')}
                              disabled={token.status === 'PRESALE'}
                            >
                              Resume Presale
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
