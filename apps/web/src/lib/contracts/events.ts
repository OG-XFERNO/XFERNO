'use client';

/**
 * XFERNO Token Discovery Hooks
 * Hooks for reading token data from contracts
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { usePublicClient, useChainId } from 'wagmi';
import { type Address, formatEther } from 'viem';
import { getContractAddresses, getChainConfig, areContractsDeployed } from './addresses';
import { tokenFactoryAbi, bondingCurveAbi, xfernoTokenAbi } from './abis';

// Types
export interface TokenCreatedEvent {
  tokenAddress: Address;
  creator: Address;
  name: string;
  symbol: string;
  bondingCurve: Address;
  blockNumber: bigint;
  transactionHash: string;
  timestamp?: number;
}

export interface TokenWithData extends TokenCreatedEvent {
  // On-chain data
  currentPrice?: bigint;
  ethReserve?: bigint;
  tokenReserve?: bigint;
  totalSupply?: bigint;
  graduated?: boolean;
  tradingEnabled?: boolean;
  // Computed
  marketCap?: number;
  bondingProgress?: number;
  liquidity?: number;
}

/**
 * Fetch all tokens from the factory contract state (not events)
 */
export function useTokenCreatedEvents() {
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const [events, setEvents] = useState<TokenCreatedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchTokens = useCallback(async () => {
    const addresses = getContractAddresses(chainId);
    
    // Check for valid contract address
    if (!publicClient || !addresses?.tokenFactory || !areContractsDeployed(chainId)) {
      setIsLoading(false);
      setEvents([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // First get total token count
      const totalTokens = await publicClient.readContract({
        address: addresses.tokenFactory,
        abi: tokenFactoryAbi,
        functionName: 'totalTokens',
      }) as bigint;

      if (totalTokens === BigInt(0)) {
        setEvents([]);
        setIsLoading(false);
        setHasFetched(true);
        return;
      }

      // Fetch all tokens (paginated if needed)
      const tokenAddresses = await publicClient.readContract({
        address: addresses.tokenFactory,
        abi: tokenFactoryAbi,
        functionName: 'getTokens',
        args: [BigInt(0), totalTokens],
      }) as Address[];

      // Fetch basic info for each token
      const tokenInfoPromises = tokenAddresses.map(async (tokenAddress) => {
        try {
          const [name, symbol, creator] = await Promise.all([
            publicClient.readContract({
              address: tokenAddress,
              abi: xfernoTokenAbi,
              functionName: 'name',
            }),
            publicClient.readContract({
              address: tokenAddress,
              abi: xfernoTokenAbi,
              functionName: 'symbol',
            }),
            publicClient.readContract({
              address: tokenAddress,
              abi: xfernoTokenAbi,
              functionName: 'creator',
            }),
          ]);

          return {
            tokenAddress,
            creator: creator as Address,
            name: name as string,
            symbol: symbol as string,
            bondingCurve: addresses.bondingCurve,
            blockNumber: BigInt(0),
            transactionHash: '',
          } as TokenCreatedEvent;
        } catch (err) {
          console.error(`Error fetching info for token ${tokenAddress}:`, err);
          return null;
        }
      });

      const tokenInfos = await Promise.all(tokenInfoPromises);
      const validTokens = tokenInfos.filter((t): t is TokenCreatedEvent => t !== null);

      // Newest first (reverse order since contract stores in creation order)
      validTokens.reverse();

      setEvents(validTokens);
      setHasFetched(true);
    } catch (err) {
      console.error('Error fetching tokens:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch tokens'));
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, chainId]);

  // Only fetch once on mount or when chain changes
  useEffect(() => {
    if (!hasFetched) {
      fetchTokens();
    }
  }, [fetchTokens, hasFetched]);

  // Reset hasFetched when chain changes
  useEffect(() => {
    setHasFetched(false);
  }, [chainId]);

  return {
    events,
    isLoading,
    error,
    refetch: fetchTokens,
  };
}

/**
 * Fetch token data for multiple tokens in parallel
 */
export function useTokensWithData(tokenAddresses: Address[]) {
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const [tokens, setTokens] = useState<Map<Address, Partial<TokenWithData>>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Stringify addresses for stable dependency
  const addressesKey = tokenAddresses.join(',');

  const fetchTokenData = useCallback(async () => {
    const addresses = getContractAddresses(chainId);
    
    if (!publicClient || !addresses?.bondingCurve || tokenAddresses.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const tokenDataMap = new Map<Address, Partial<TokenWithData>>();

      // Batch fetch data for all tokens
      const dataPromises = tokenAddresses.map(async (tokenAddress) => {
        try {
          // Fetch token state from bonding curve
          const [tokenState, currentPrice, tokenInfo] = await Promise.all([
            publicClient.readContract({
              address: addresses.bondingCurve,
              abi: bondingCurveAbi,
              functionName: 'getTokenState',
              args: [tokenAddress],
            }).catch(() => null),
            publicClient.readContract({
              address: addresses.bondingCurve,
              abi: bondingCurveAbi,
              functionName: 'getCurrentPrice',
              args: [tokenAddress],
            }).catch(() => BigInt(0)),
            Promise.all([
              publicClient.readContract({
                address: tokenAddress,
                abi: xfernoTokenAbi,
                functionName: 'totalSupply',
              }).catch(() => BigInt(0)),
              publicClient.readContract({
                address: tokenAddress,
                abi: xfernoTokenAbi,
                functionName: 'graduated',
              }).catch(() => false),
              publicClient.readContract({
                address: tokenAddress,
                abi: xfernoTokenAbi,
                functionName: 'tradingEnabled',
              }).catch(() => false),
            ]),
          ]);

          const [totalSupply, graduated, tradingEnabled] = tokenInfo;
          
          // Calculate bonding progress (6.9 ETH graduation threshold)
          const graduationThreshold = BigInt('6900000000000000000');
          const ethReserve = tokenState ? (tokenState as any).ethReserve : BigInt(0);
          const bondingProgress = graduationThreshold > 0 
            ? Math.min(100, Number((ethReserve * BigInt(100)) / graduationThreshold))
            : 0;

          // Calculate market cap (price * circulating supply)
          const priceNum = Number(formatEther(currentPrice as bigint));
          const supplyNum = Number(formatEther(totalSupply as bigint));
          const marketCap = priceNum * supplyNum;
          const liquidity = Number(formatEther(ethReserve));

          tokenDataMap.set(tokenAddress, {
            tokenAddress,
            currentPrice: currentPrice as bigint,
            ethReserve,
            tokenReserve: tokenState ? (tokenState as any).tokenReserve : BigInt(0),
            totalSupply: totalSupply as bigint,
            graduated: graduated as boolean,
            tradingEnabled: tradingEnabled as boolean,
            marketCap,
            bondingProgress,
            liquidity,
          });
        } catch (err) {
          console.error(`Error fetching data for token ${tokenAddress}:`, err);
        }
      });

      await Promise.all(dataPromises);
      setTokens(tokenDataMap);
    } catch (err) {
      console.error('Error fetching token data:', err);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicClient, chainId, addressesKey]);

  useEffect(() => {
    if (tokenAddresses.length > 0) {
      fetchTokenData();
    }
  }, [fetchTokenData, tokenAddresses.length]);

  return {
    tokens,
    isLoading,
    refetch: fetchTokenData,
  };
}

/**
 * Combined hook to get all tokens with their data
 */
export function useAllTokens() {
  const { events, isLoading: eventsLoading, error, refetch: refetchEvents } = useTokenCreatedEvents();
  
  // Memoize token addresses to prevent unnecessary refetches
  const tokenAddresses = useMemo(() => events.map(e => e.tokenAddress), [events]);
  const { tokens: tokenData, isLoading: dataLoading, refetch: refetchData } = useTokensWithData(tokenAddresses);

  // Merge events with token data - memoized
  const tokensWithData = useMemo<TokenWithData[]>(() => {
    return events.map(event => ({
      ...event,
      ...(tokenData.get(event.tokenAddress) || {}),
    }));
  }, [events, tokenData]);

  const refetch = useCallback(() => {
    refetchEvents();
    refetchData();
  }, [refetchEvents, refetchData]);

  return {
    tokens: tokensWithData,
    isLoading: eventsLoading || dataLoading,
    error,
    refetch,
  };
}

/**
 * Get a single token's full data
 */
export function useTokenFullData(tokenAddress: Address | undefined) {
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const [data, setData] = useState<TokenWithData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchData = useCallback(async () => {
    const addresses = getContractAddresses(chainId);
    
    if (!publicClient || !addresses?.bondingCurve || !tokenAddress) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch all token data
      const [
        name,
        symbol,
        totalSupply,
        creator,
        graduated,
        tradingEnabled,
        tokenState,
        currentPrice,
      ] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress,
          abi: xfernoTokenAbi,
          functionName: 'name',
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: xfernoTokenAbi,
          functionName: 'symbol',
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: xfernoTokenAbi,
          functionName: 'totalSupply',
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: xfernoTokenAbi,
          functionName: 'creator',
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: xfernoTokenAbi,
          functionName: 'graduated',
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: xfernoTokenAbi,
          functionName: 'tradingEnabled',
        }),
        publicClient.readContract({
          address: addresses.bondingCurve,
          abi: bondingCurveAbi,
          functionName: 'getTokenState',
          args: [tokenAddress],
        }),
        publicClient.readContract({
          address: addresses.bondingCurve,
          abi: bondingCurveAbi,
          functionName: 'getCurrentPrice',
          args: [tokenAddress],
        }),
      ]);

      const ethReserve = (tokenState as any).ethReserve;
      const tokenReserve = (tokenState as any).tokenReserve;
      
      // Calculate progress
      const graduationThreshold = BigInt('6900000000000000000'); // 6.9 ETH
      const bondingProgress = Math.min(100, Number((ethReserve * BigInt(100)) / graduationThreshold));

      // Calculate market cap
      const priceNum = Number(formatEther(currentPrice as bigint));
      const supplyNum = Number(formatEther(totalSupply as bigint));
      const marketCap = priceNum * supplyNum;
      const liquidity = Number(formatEther(ethReserve));

      setData({
        tokenAddress,
        creator: creator as Address,
        name: name as string,
        symbol: symbol as string,
        bondingCurve: addresses.bondingCurve,
        blockNumber: BigInt(0),
        transactionHash: '',
        currentPrice: currentPrice as bigint,
        ethReserve,
        tokenReserve,
        totalSupply: totalSupply as bigint,
        graduated: graduated as boolean,
        tradingEnabled: tradingEnabled as boolean,
        marketCap,
        bondingProgress,
        liquidity,
      });
      setHasFetched(true);
    } catch (err) {
      console.error('Error fetching token data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch token data'));
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, chainId, tokenAddress]);

  useEffect(() => {
    if (tokenAddress && !hasFetched) {
      fetchData();
    }
  }, [fetchData, tokenAddress, hasFetched]);

  // Reset when token changes
  useEffect(() => {
    setHasFetched(false);
    setData(null);
  }, [tokenAddress]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
