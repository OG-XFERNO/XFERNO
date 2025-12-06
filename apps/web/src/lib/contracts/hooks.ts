'use client';

/**
 * XFERNO Contract Hooks
 * wagmi hooks for interacting with XFERNO contracts
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { type Address } from 'viem';
import { tokenFactoryAbi, bondingCurveAbi, xfernoTokenAbi } from './abis';
import { getContractAddresses, getChainConfig } from './addresses';

// ============================================
// TOKEN FACTORY HOOKS
// ============================================

/**
 * Get the token creation fee from contract or config
 */
export function useCreationFee() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);
  const config = getChainConfig(chainId);

  const contractFee = useReadContract({
    address: addresses?.tokenFactory,
    abi: tokenFactoryAbi,
    functionName: 'creationFee',
    query: {
      enabled: !!addresses?.tokenFactory,
    },
  });

  // Return contract fee if available, otherwise fallback to config
  return {
    ...contractFee,
    data: contractFee.data ?? config?.creationFee,
  };
}

/**
 * Get total number of tokens created
 */
export function useTotalTokens() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  return useReadContract({
    address: addresses?.tokenFactory,
    abi: tokenFactoryAbi,
    functionName: 'totalTokens',
    query: {
      enabled: !!addresses?.tokenFactory,
    },
  });
}

/**
 * Get tokens by creator
 */
export function useTokensByCreator(creator: Address | undefined) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  return useReadContract({
    address: addresses?.tokenFactory,
    abi: tokenFactoryAbi,
    functionName: 'getTokensByCreator',
    args: creator ? [creator] : undefined,
    query: {
      enabled: !!addresses?.tokenFactory && !!creator,
    },
  });
}

/**
 * Check if an address is a valid XFERNO token
 */
export function useIsXfernoToken(tokenAddress: Address | undefined) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  return useReadContract({
    address: addresses?.tokenFactory,
    abi: tokenFactoryAbi,
    functionName: 'isXfernoToken',
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!addresses?.tokenFactory && !!tokenAddress,
    },
  });
}

/**
 * Create a new token
 */
export function useCreateToken() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createToken = async (params: {
    name: string;
    symbol: string;
    description: string;
    imageUri: string;
    socialLinks: string[];
    value: bigint;
  }) => {
    if (!addresses?.tokenFactory) {
      throw new Error('Contracts not deployed on this chain');
    }

    return writeContract({
      address: addresses.tokenFactory,
      abi: tokenFactoryAbi,
      functionName: 'createToken',
      args: [
        {
          name: params.name,
          symbol: params.symbol,
          description: params.description,
          imageUri: params.imageUri,
          socialLinks: params.socialLinks,
        },
      ],
      value: params.value,
    });
  };

  return {
    createToken,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// ============================================
// BONDING CURVE HOOKS
// ============================================

/**
 * Get curve parameters
 */
export function useCurveParams() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  return useReadContract({
    address: addresses?.bondingCurve,
    abi: bondingCurveAbi,
    functionName: 'curveParams',
    query: {
      enabled: !!addresses?.bondingCurve,
    },
  });
}

/**
 * Get token state on the bonding curve
 */
export function useTokenState(tokenAddress: Address | undefined) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  return useReadContract({
    address: addresses?.bondingCurve,
    abi: bondingCurveAbi,
    functionName: 'getTokenState',
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!addresses?.bondingCurve && !!tokenAddress,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });
}

/**
 * Get current token price from the bonding curve contract
 * This is the authoritative price source
 */
export function useCurrentPrice(tokenAddress: Address | undefined) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  return useReadContract({
    address: addresses?.bondingCurve,
    abi: bondingCurveAbi,
    functionName: 'getCurrentPrice',
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!addresses?.bondingCurve && !!tokenAddress,
      refetchInterval: 2000, // Poll every 2 seconds for real-time price
    },
  });
}

/**
 * Get buy price for amount of tokens
 */
export function useBuyPrice(tokenAddress: Address | undefined, tokenAmount: bigint | undefined) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  return useReadContract({
    address: addresses?.bondingCurve,
    abi: bondingCurveAbi,
    functionName: 'getBuyPrice',
    args: tokenAddress && tokenAmount ? [tokenAddress, tokenAmount] : undefined,
    query: {
      enabled: !!addresses?.bondingCurve && !!tokenAddress && !!tokenAmount && tokenAmount > BigInt(0),
    },
  });
}

/**
 * Get sell price for amount of tokens
 */
export function useSellPrice(tokenAddress: Address | undefined, tokenAmount: bigint | undefined) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  return useReadContract({
    address: addresses?.bondingCurve,
    abi: bondingCurveAbi,
    functionName: 'getSellPrice',
    args: tokenAddress && tokenAmount ? [tokenAddress, tokenAmount] : undefined,
    query: {
      enabled: !!addresses?.bondingCurve && !!tokenAddress && !!tokenAmount && tokenAmount > BigInt(0),
    },
  });
}

/**
 * Check if token can graduate
 */
export function useCanGraduate(tokenAddress: Address | undefined) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  return useReadContract({
    address: addresses?.bondingCurve,
    abi: bondingCurveAbi,
    functionName: 'canGraduate',
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!addresses?.bondingCurve && !!tokenAddress,
    },
  });
}

/**
 * Buy tokens from the bonding curve
 */
export function useBuyTokens() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const buy = async (params: { token: Address; minTokens: bigint; value: bigint }) => {
    if (!addresses?.bondingCurve) {
      throw new Error('Contracts not deployed on this chain');
    }

    return writeContract({
      address: addresses.bondingCurve,
      abi: bondingCurveAbi,
      functionName: 'buy',
      args: [params.token, params.minTokens],
      value: params.value,
      gas: BigInt(300000), // Manual gas limit to prevent estimation issues
    });
  };

  return {
    buy,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Sell tokens to the bonding curve
 */
export function useSellTokens() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const sell = async (params: { token: Address; tokenAmount: bigint; minEth: bigint }) => {
    if (!addresses?.bondingCurve) {
      throw new Error('Contracts not deployed on this chain');
    }

    return writeContract({
      address: addresses.bondingCurve,
      abi: bondingCurveAbi,
      functionName: 'sell',
      args: [params.token, params.tokenAmount, params.minEth],
      gas: BigInt(350000), // Higher gas limit for sell (includes token burn)
    });
  };

  return {
    sell,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// ============================================
// TOKEN HOOKS
// ============================================

/**
 * Get token balance
 */
export function useTokenBalance(tokenAddress: Address | undefined, account: Address | undefined) {
  return useReadContract({
    address: tokenAddress,
    abi: xfernoTokenAbi,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    query: {
      enabled: !!tokenAddress && !!account,
      refetchInterval: 10000,
    },
  });
}

/**
 * Get token info
 */
export function useTokenInfo(tokenAddress: Address | undefined) {
  const name = useReadContract({
    address: tokenAddress,
    abi: xfernoTokenAbi,
    functionName: 'name',
    query: { enabled: !!tokenAddress },
  });

  const symbol = useReadContract({
    address: tokenAddress,
    abi: xfernoTokenAbi,
    functionName: 'symbol',
    query: { enabled: !!tokenAddress },
  });

  const totalSupply = useReadContract({
    address: tokenAddress,
    abi: xfernoTokenAbi,
    functionName: 'totalSupply',
    query: { enabled: !!tokenAddress },
  });

  const creator = useReadContract({
    address: tokenAddress,
    abi: xfernoTokenAbi,
    functionName: 'creator',
    query: { enabled: !!tokenAddress },
  });

  const graduated = useReadContract({
    address: tokenAddress,
    abi: xfernoTokenAbi,
    functionName: 'graduated',
    query: { enabled: !!tokenAddress },
  });

  return {
    name: name.data,
    symbol: symbol.data,
    totalSupply: totalSupply.data,
    creator: creator.data,
    graduated: graduated.data,
    isLoading: name.isLoading || symbol.isLoading || totalSupply.isLoading,
    error: name.error || symbol.error || totalSupply.error,
  };
}

/**
 * Approve token spending
 */
export function useApproveToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = async (params: { token: Address; spender: Address; amount: bigint }) => {
    return writeContract({
      address: params.token,
      abi: xfernoTokenAbi,
      functionName: 'approve',
      args: [params.spender, params.amount],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Get token allowance
 */
export function useTokenAllowance(
  tokenAddress: Address | undefined,
  owner: Address | undefined,
  spender: Address | undefined
) {
  return useReadContract({
    address: tokenAddress,
    abi: xfernoTokenAbi,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!tokenAddress && !!owner && !!spender,
    },
  });
}
