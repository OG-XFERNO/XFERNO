import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
// Socket.io uses HTTP for handshake, then upgrades to WebSocket
const WS_BASE = API_BASE;

// Types
export interface Trade {
  id: string;
  tokenAddress: string;
  traderAddress: string;
  tradeType: 'BUY' | 'SELL';
  ethAmount: string;
  tokenAmount: string;
  pricePerToken: string;
  txHash: string;
  blockNumber: string;
  blockTimestamp: string;
}

export interface PriceCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TokenStats {
  tokenAddress: string;
  chainId: number;
  currentPrice: string;
  priceChange24h: number;
  volume24h: string;
  trades24h: number;
  totalVolume: string;
  totalTrades: number;
  allTimeHigh: string;
  allTimeLow: string;
  updatedAt: string;
}

// Fetch recent trades
export async function fetchRecentTrades(
  tokenAddress: string,
  chainId: number,
  limit = 50
): Promise<Trade[]> {
  const response = await fetch(
    `${API_BASE}/api/indexer/trades/${tokenAddress}?chainId=${chainId}&limit=${limit}`
  );
  if (!response.ok) throw new Error('Failed to fetch trades');
  const data = await response.json();
  return data.trades;
}

// Fetch price candles
export async function fetchPriceCandles(
  tokenAddress: string,
  chainId: number,
  interval: string,
  from: Date,
  to: Date
): Promise<PriceCandle[]> {
  const response = await fetch(
    `${API_BASE}/api/indexer/candles/${tokenAddress}?chainId=${chainId}&interval=${interval}&from=${from.toISOString()}&to=${to.toISOString()}`
  );
  if (!response.ok) throw new Error('Failed to fetch candles');
  const data = await response.json();
  return data.candles;
}

// Fetch token stats
export async function fetchTokenStats(
  tokenAddress: string,
  chainId: number
): Promise<TokenStats | null> {
  const response = await fetch(
    `${API_BASE}/api/indexer/stats/${tokenAddress}?chainId=${chainId}`
  );
  if (!response.ok) throw new Error('Failed to fetch stats');
  const data = await response.json();
  return data.stats;
}

// React Query hooks
export function useRecentTrades(tokenAddress: string | undefined, chainId: number) {
  return useQuery({
    queryKey: ['trades', tokenAddress, chainId],
    queryFn: () => fetchRecentTrades(tokenAddress!, chainId),
    enabled: !!tokenAddress,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

export function usePriceCandles(
  tokenAddress: string | undefined,
  chainId: number,
  interval: string
) {
  const now = new Date();
  const from = new Date(now.getTime() - getIntervalDuration(interval));

  return useQuery({
    queryKey: ['candles', tokenAddress, chainId, interval],
    queryFn: () => fetchPriceCandles(tokenAddress!, chainId, interval, from, now),
    enabled: !!tokenAddress,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useTokenStats(tokenAddress: string | undefined, chainId: number) {
  return useQuery({
    queryKey: ['tokenStats', tokenAddress, chainId],
    queryFn: () => fetchTokenStats(tokenAddress!, chainId),
    enabled: !!tokenAddress,
    refetchInterval: 15000, // Refetch every 15 seconds
  });
}

// WebSocket hook for real-time trades
export function useTradeSocket(tokenAddress: string | undefined, chainId: number) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastTrade, setLastTrade] = useState<Trade | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tokenAddress) return;

    const newSocket = io(`${WS_BASE}/trading`, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Subscribe to token trades
      newSocket.emit('subscribe', { tokenAddress, chainId });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('trade', (trade: Trade) => {
      setLastTrade(trade);
      // Invalidate trades query to refetch
      queryClient.invalidateQueries({ queryKey: ['trades', tokenAddress, chainId] });
      queryClient.invalidateQueries({ queryKey: ['tokenStats', tokenAddress, chainId] });
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('unsubscribe', { tokenAddress, chainId });
      newSocket.disconnect();
    };
  }, [tokenAddress, chainId, queryClient]);

  return { socket, isConnected, lastTrade };
}

// Helper to get duration for chart interval
function getIntervalDuration(interval: string): number {
  const durations: Record<string, number> = {
    '1m': 60 * 60 * 1000, // 1 hour of 1m candles
    '5m': 6 * 60 * 60 * 1000, // 6 hours of 5m candles
    '15m': 24 * 60 * 60 * 1000, // 1 day of 15m candles
    '1h': 7 * 24 * 60 * 60 * 1000, // 1 week of 1h candles
    '4h': 30 * 24 * 60 * 60 * 1000, // 1 month of 4h candles
    '1d': 365 * 24 * 60 * 60 * 1000, // 1 year of 1d candles
  };
  return durations[interval] || durations['5m'];
}

// Convert interval label to API format
export function intervalToApiFormat(label: string): string {
  const mapping: Record<string, string> = {
    '1': '1m',
    '5': '5m',
    '15': '15m',
    '60': '1h',
    '240': '4h',
    '1440': '1d',
  };
  return mapping[label] || '5m';
}
