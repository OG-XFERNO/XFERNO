'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount, useBalance, useChainId, useGasPrice } from 'wagmi';
import { formatEther, parseEther, type Address } from 'viem';
import { txToast, dismissToast } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ConnectButton } from '@/components/wallet/connect-button';
import { TradingChart } from '@/components/trading/chart';
import { OrderBook } from '@/components/trading/order-book';
import { RecentTrades } from '@/components/trading/recent-trades';
import { TokenSelector } from '@/components/trading/token-selector';
import { GAS_MULTIPLIERS } from '@/lib/wagmi';
import {
  useTokenInfo,
  useTokenBalance,
  useTokenState,
  useCurrentPrice,
  useBuyTokens,
  useSellTokens,
  useApproveToken,
  useTokenAllowance,
  useCurveParams,
  getContractAddresses,
  isChainSupported,
  getExplorerTxUrl,
} from '@/lib/contracts';
import { useTokenStats } from '@/lib/api/trading';
import {
  ArrowDownUp,
  TrendingUp,
  TrendingDown,
  Fuel,
  Percent,
  Info,
  Zap,
  AlertTriangle,
  RefreshCw,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Coins,
} from 'lucide-react';
import { NETWORK_CONFIG } from '@/components/tokens/token-card';

// Default token when none is selected
const DEFAULT_TOKEN = {
  address: null as Address | null,
  name: 'Select a Token',
  symbol: 'TOKEN',
  price: 0,
  priceChange24h: 0,
  volume24h: 0,
  trades24h: 0,
  marketCap: 0,
  liquidity: 0,
  graduated: false,
  totalTrades: 0,
  totalVolume: 0,
  allTimeHigh: 0,
  allTimeLow: 0,
};

export default function TradePage() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token');
  const tokenAddress = tokenParam && tokenParam.startsWith('0x') ? tokenParam as Address : undefined;

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: ethBalance } = useBalance({ address });
  const { data: gasPrice } = useGasPrice();
  
  // Get native token symbol for current network
  const network = NETWORK_CONFIG[chainId] || NETWORK_CONFIG[11155111];
  const nativeSymbol = network?.symbol || 'ETH';

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [txSuccess, setTxSuccess] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Contract addresses
  const contractAddresses = getContractAddresses(chainId);
  const chainSupported = isChainSupported(chainId);

  // Token data from contracts
  const tokenInfo = useTokenInfo(tokenAddress);
  const { data: tokenBalanceData, refetch: refetchBalance } = useTokenBalance(tokenAddress, address);
  const { data: tokenState, refetch: refetchState } = useTokenState(tokenAddress);
  const { data: currentPrice, refetch: refetchPrice } = useCurrentPrice(tokenAddress);
  const { data: curveParams } = useCurveParams();
  const { data: allowance, refetch: refetchAllowance } = useTokenAllowance(
    tokenAddress,
    address,
    contractAddresses?.bondingCurve
  );

  // Trading hooks
  const { 
    buy, 
    isPending: isBuying, 
    isConfirming: isBuyConfirming, 
    isSuccess: buySuccess,
    hash: buyHash,
    error: buyError 
  } = useBuyTokens();
  
  const { 
    sell, 
    isPending: isSelling, 
    isConfirming: isSellConfirming, 
    isSuccess: sellSuccess,
    hash: sellHash,
    error: sellError 
  } = useSellTokens();
  
  const { 
    approve, 
    isPending: isApproving, 
    isConfirming: isApproveConfirming,
    isSuccess: approveSuccess,
    error: approveError 
  } = useApproveToken();

  // Derived state
  const isLoading = isBuying || isBuyConfirming || isSelling || isSellConfirming || isApproving || isApproveConfirming;
  const tokenBalance = tokenBalanceData ? parseFloat(formatEther(tokenBalanceData)) : 0;
  const priceInEth = currentPrice ? parseFloat(formatEther(currentPrice)) : 0;
  const feeBps = curveParams ? Number(curveParams.feeBps) : 100;
  const platformFeePercent = feeBps / 10000;

  // Fetch indexed stats
  const { data: indexedStats } = useTokenStats(tokenAddress, chainId);

  // Calculate liquidity from contract state or indexed data
  const contractLiquidity = tokenState?.ethReserve ? parseFloat(formatEther(tokenState.ethReserve)) : 0;
  const indexedLiquidity = indexedStats?.totalVolume ? parseFloat(indexedStats.totalVolume) / 1e18 : 0;
  const effectiveLiquidity = contractLiquidity > 0 ? contractLiquidity : indexedLiquidity;

  // Build token display data with real indexed stats
  const token = tokenAddress && tokenInfo.name ? {
    address: tokenAddress,
    name: tokenInfo.name,
    symbol: tokenInfo.symbol || 'TOKEN',
    price: priceInEth,
    priceChange24h: indexedStats?.priceChange24h ?? 0,
    volume24h: indexedStats?.volume24h ? parseFloat(indexedStats.volume24h) / 1e18 : 0,
    trades24h: indexedStats?.trades24h ?? 0,
    marketCap: effectiveLiquidity * 2,
    liquidity: effectiveLiquidity,
    graduated: tokenInfo.graduated || false,
    totalTrades: indexedStats?.totalTrades ?? 0,
    totalVolume: indexedStats?.totalVolume ? parseFloat(indexedStats.totalVolume) / 1e18 : 0,
    allTimeHigh: indexedStats?.allTimeHigh ? parseFloat(indexedStats.allTimeHigh) : 0,
    allTimeLow: indexedStats?.allTimeLow ? parseFloat(indexedStats.allTimeLow) : 0,
  } : DEFAULT_TOKEN;

  // Check if approval is needed for selling
  const sellAmountWei = amount && parseFloat(amount) > 0 ? parseEther(amount) : BigInt(0);
  const needsApproval = activeTab === 'sell' && 
    tokenAddress && 
    contractAddresses?.bondingCurve &&
    allowance !== undefined && 
    sellAmountWei > BigInt(0) &&
    allowance < sellAmountWei;

  // Toast tracking
  const buyToastRef = useRef<string | number | null>(null);
  const sellToastRef = useRef<string | number | null>(null);
  const approveToastRef = useRef<string | number | null>(null);
  const explorerBase = getExplorerTxUrl(chainId, '')?.replace('/tx/', '') || '';

  // Buy transaction toasts
  useEffect(() => {
    if (isBuying && !buyToastRef.current) {
      buyToastRef.current = txToast.pending('Processing buy order...');
    }
  }, [isBuying]);

  useEffect(() => {
    if (isBuyConfirming && buyHash && buyToastRef.current) {
      dismissToast(buyToastRef.current);
      buyToastRef.current = txToast.submitted(buyHash, explorerBase);
    }
  }, [isBuyConfirming, buyHash, explorerBase]);

  useEffect(() => {
    if (buySuccess && buyHash) {
      if (buyToastRef.current) {
        dismissToast(buyToastRef.current);
        buyToastRef.current = null;
      }
      txToast.success(`Bought ${token.symbol}!`, buyHash, explorerBase);
      setTxSuccess(true);
      setLastTxHash(buyHash);
      setAmount('');
      refetchBalance();
      refetchState();
      refetchPrice();
    }
  }, [buySuccess, buyHash, token.symbol, explorerBase]);

  // Sell transaction toasts
  useEffect(() => {
    if (isSelling && !sellToastRef.current) {
      sellToastRef.current = txToast.pending('Processing sell order...');
    }
  }, [isSelling]);

  useEffect(() => {
    if (isSellConfirming && sellHash && sellToastRef.current) {
      dismissToast(sellToastRef.current);
      sellToastRef.current = txToast.submitted(sellHash, explorerBase);
    }
  }, [isSellConfirming, sellHash, explorerBase]);

  useEffect(() => {
    if (sellSuccess && sellHash) {
      if (sellToastRef.current) {
        dismissToast(sellToastRef.current);
        sellToastRef.current = null;
      }
      txToast.success(`Sold ${token.symbol}!`, sellHash, explorerBase);
      setTxSuccess(true);
      setLastTxHash(sellHash);
      setAmount('');
      refetchBalance();
      refetchState();
      refetchPrice();
    }
  }, [sellSuccess, sellHash, token.symbol, explorerBase]);

  // Approve transaction toasts
  useEffect(() => {
    if (isApproving && !approveToastRef.current) {
      approveToastRef.current = txToast.pending('Approving token...');
    }
  }, [isApproving]);

  useEffect(() => {
    if (isApproveConfirming && approveToastRef.current) {
      dismissToast(approveToastRef.current);
      approveToastRef.current = txToast.pending('Confirming approval...');
    }
  }, [isApproveConfirming]);

  useEffect(() => {
    if (approveSuccess) {
      if (approveToastRef.current) {
        dismissToast(approveToastRef.current);
        approveToastRef.current = null;
      }
      txToast.success('Token approved!');
      refetchAllowance();
    }
  }, [approveSuccess]);

  // Error handling
  useEffect(() => {
    const error = buyError || sellError || approveError;
    if (error) {
      // Clear any pending toasts
      [buyToastRef, sellToastRef, approveToastRef].forEach(ref => {
        if (ref.current) {
          dismissToast(ref.current);
          ref.current = null;
        }
      });
      
      if (error.message?.includes('User rejected')) {
        txToast.rejected();
      } else {
        txToast.error('Transaction failed', error.message?.slice(0, 100));
      }
    }
  }, [buyError, sellError, approveError]);

  // Real-time calculations
  const calculations = useMemo(() => {
    const inputAmount = parseFloat(amount) || 0;
    const tokenPrice = token.price || 0.000001;
    const gasMultiplier = GAS_MULTIPLIERS[chainId] || 1.2;

    // Gas estimation
    const estimatedGasUnits = activeTab === 'buy' ? BigInt(200000) : BigInt(150000);
    const gasPriceWei = gasPrice || BigInt(20000000000);
    const estimatedGasWei = estimatedGasUnits * gasPriceWei * BigInt(Math.floor(gasMultiplier * 100)) / BigInt(100);
    const estimatedGasEth = parseFloat(formatEther(estimatedGasWei));

    if (activeTab === 'buy') {
      const tokensReceived = tokenPrice > 0 ? inputAmount / tokenPrice : 0;
      const platformFee = inputAmount * platformFeePercent;
      const totalCost = inputAmount + estimatedGasEth;
      const priceImpact = token.liquidity > 0 ? (inputAmount / token.liquidity) * 100 : 0;

      return {
        inputAmount,
        outputAmount: tokensReceived,
        platformFee,
        estimatedGas: estimatedGasEth,
        totalCost,
        priceImpact,
        rate: tokenPrice,
      };
    } else {
      const ethReceived = inputAmount * tokenPrice;
      const platformFee = ethReceived * platformFeePercent;
      const netReceived = ethReceived - platformFee;
      const priceImpact = token.liquidity > 0 ? (ethReceived / token.liquidity) * 100 : 0;

      return {
        inputAmount,
        outputAmount: netReceived,
        platformFee,
        estimatedGas: estimatedGasEth,
        totalCost: estimatedGasEth,
        priceImpact,
        rate: tokenPrice,
      };
    }
  }, [amount, activeTab, chainId, gasPrice, token.price, token.liquidity, platformFeePercent]);

  const handlePercentageClick = (percent: number) => {
    if (activeTab === 'buy' && ethBalance) {
      const maxAmount = parseFloat(ethBalance.formatted) * (percent / 100);
      setAmount(maxAmount.toFixed(6));
    } else if (activeTab === 'sell') {
      if (percent === 100 && tokenBalanceData) {
        // Use exact balance for 100% to avoid rounding issues
        setAmount(formatEther(tokenBalanceData));
      } else {
        const maxAmount = tokenBalance * (percent / 100);
        setAmount(maxAmount.toFixed(6)); // More precision
      }
    }
  };

  const handleApprove = async () => {
    if (!tokenAddress || !contractAddresses?.bondingCurve) return;

    try {
      await approve({
        token: tokenAddress,
        spender: contractAddresses.bondingCurve,
        // Approve max uint256 for convenience
        amount: BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935'),
      });
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleTrade = async () => {
    if (!isConnected || !amount || !tokenAddress) return;

    const parsedAmount = parseEther(amount);
    const slippageMultiplier = BigInt(Math.floor((100 - slippage) * 100));

    try {
      if (activeTab === 'buy') {
        // For now, set minTokens to 0 (no slippage protection)
        // TODO: Use contract's getBuyPrice to calculate expected tokens
        // The current price-based calculation can overflow when price is very low
        const minTokens = BigInt(0);

        await buy({
          token: tokenAddress,
          minTokens,
          value: parsedAmount,
        });
      } else {
        // Check approval first
        if (needsApproval) {
          console.log('Approval needed, requesting approval...');
          await handleApprove();
          return;
        }

        // Check if user has enough tokens
        const userBalance = tokenBalanceData || BigInt(0);
        console.log('Sell validation:', {
          token: tokenAddress,
          tokenAmount: parsedAmount.toString(),
          userBalance: userBalance.toString(),
          hasEnough: userBalance >= parsedAmount,
          allowance: allowance?.toString(),
        });

        if (parsedAmount > userBalance) {
          console.error('Insufficient token balance!');
          txToast.error(`Insufficient balance. You have ${parseFloat(formatEther(userBalance)).toFixed(4)} tokens.`);
          return;
        }

        // Check if token is graduated (can't trade on bonding curve after graduation)
        if (tokenInfo.graduated) {
          console.error('Token has graduated!');
          txToast.error('This token has graduated and can no longer be traded on the bonding curve.');
          return;
        }

        // For now, set minEth to 0 (no slippage protection)
        // TODO: Use contract's getSellPrice to calculate expected ETH
        // The current calculation can cause SlippageExceeded errors
        const minEth = BigInt(0);

        await sell({
          token: tokenAddress,
          tokenAmount: parsedAmount,
          minEth,
        });
      }
    } catch (err: any) {
      console.error('Trade failed:', err);
      // Log more details about the error
      if (err?.cause) console.error('Error cause:', err.cause);
      if (err?.message) console.error('Error message:', err.message);
    }
  };

  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

  // Format ETH price - show full decimals for small values
  const formatPriceETH = (price: number) => {
    if (price === 0) return '0';
    if (price < 0.000001) {
      return price.toFixed(12).replace(/\.?0+$/, '');
    } else if (price < 0.001) {
      return price.toFixed(9).replace(/\.?0+$/, '');
    } else if (price < 1) {
      return price.toFixed(6).replace(/\.?0+$/, '');
    }
    return price.toFixed(4);
  };

  const txError = buyError || sellError || approveError;

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="py-8">
                <div className="space-y-4">
                  <div className="h-10 bg-muted rounded animate-pulse" />
                  <div className="h-14 bg-muted rounded animate-pulse" />
                  <div className="h-14 bg-muted rounded animate-pulse" />
                  <div className="h-12 bg-muted rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Trading Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Token Header */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {tokenAddress ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-gradient-fire flex items-center justify-center text-white font-bold">
                        {token.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h1 className="text-xl font-bold">{token.name}</h1>
                          <Badge variant="outline">{token.symbol}</Badge>
                          {'graduated' in token && token.graduated && (
                            <Badge variant="success">Graduated</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-2xl font-bold">
                            {token.price > 0 ? formatPriceETH(token.price) : '0'} {nativeSymbol}
                          </span>
                          {token.priceChange24h !== 0 && (
                            <Badge
                              variant={token.priceChange24h >= 0 ? 'success' : 'destructive'}
                              className="gap-1"
                            >
                              {token.priceChange24h >= 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {token.priceChange24h.toFixed(2)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-4">
                      <Coins className="w-12 h-12 text-muted-foreground" />
                      <div>
                        <h1 className="text-xl font-bold text-muted-foreground">Select a Token</h1>
                        <p className="text-sm text-muted-foreground">Choose a token to start trading</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <TokenSelector selectedToken={tokenAddress} />
                  {tokenAddress && (
                    <div className="hidden sm:flex flex-wrap gap-4 sm:gap-6 text-sm">
                      <div className="min-w-[70px]">
                        <p className="text-muted-foreground text-xs">24h Volume</p>
                        <p className="font-medium">{formatPriceETH(token.volume24h)} {nativeSymbol}</p>
                      </div>
                      <div className="min-w-[70px]">
                        <p className="text-muted-foreground text-xs">Trades</p>
                        <p className="font-medium">{token.totalTrades}</p>
                      </div>
                      <div className="min-w-[70px]">
                        <p className="text-muted-foreground text-xs">Liquidity</p>
                        <p className="font-medium">{formatPriceETH(token.liquidity)} {nativeSymbol}</p>
                      </div>
                      <div className="min-w-[70px]">
                        <p className="text-muted-foreground text-xs">Your Balance</p>
                        <p className="font-medium">{formatNumber(tokenBalance)} {token.symbol}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="p-0">
              <TradingChart tokenAddress={tokenAddress} currentPrice={token.price} />
            </CardContent>
          </Card>

          {/* Order Book & Recent Trades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <OrderBook tokenAddress={tokenAddress} currentPrice={token.price} />
            <RecentTrades tokenAddress={tokenAddress} />
          </div>
        </div>

        {/* Trading Panel */}
        <div className="lg:col-span-4 order-first lg:order-last">
          <Card className="border-border/50 bg-card/50 backdrop-blur lg:sticky lg:top-20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ArrowDownUp className="w-5 h-5" />
                  Swap
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Buy/Sell Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'buy' | 'sell')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="buy"
                    className="data-[state=active]:bg-success data-[state=active]:text-white"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Buy
                  </TabsTrigger>
                  <TabsTrigger
                    value="sell"
                    className="data-[state=active]:bg-destructive data-[state=active]:text-white"
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Sell
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="buy" className="space-y-4 mt-4">
                  {/* Input Amount */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <Label>You Pay</Label>
                      <span className="text-muted-foreground">
                        Balance: {ethBalance ? ethBalance.formatted : '0'} ETH
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pr-16 text-lg h-14"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="font-medium">ETH</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {[25, 50, 75, 100].map((percent) => (
                        <Button
                          key={percent}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handlePercentageClick(percent)}
                        >
                          {percent}%
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Output Amount */}
                  <div className="space-y-2">
                    <Label>You Receive</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="0.0"
                        value={calculations.outputAmount > 0 ? formatNumber(calculations.outputAmount, 4) : ''}
                        readOnly
                        className="pr-20 text-lg h-14 bg-muted/50"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="font-medium">{token.symbol}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sell" className="space-y-4 mt-4">
                  {/* Input Amount */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <Label>You Sell</Label>
                      <span className="text-muted-foreground">
                        Balance: {tokenBalanceData ? formatEther(tokenBalanceData) : '0'} {token.symbol}
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pr-20 text-lg h-14"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="font-medium">{token.symbol}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {[25, 50, 75, 100].map((percent) => (
                        <Button
                          key={percent}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handlePercentageClick(percent)}
                        >
                          {percent}%
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Output Amount */}
                  <div className="space-y-2">
                    <Label>You Receive</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="0.0"
                        value={calculations.outputAmount > 0 ? calculations.outputAmount.toFixed(6) : ''}
                        readOnly
                        className="pr-16 text-lg h-14 bg-muted/50"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="font-medium">ETH</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Slippage Setting */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Label className="flex items-center gap-1">
                    Slippage Tolerance
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </Label>
                  <span className="font-medium">{slippage}%</span>
                </div>
                <div className="flex gap-2">
                  {[0.1, 0.5, 1, 3].map((s) => (
                    <Button
                      key={s}
                      variant={slippage === s ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setSlippage(s)}
                    >
                      {s}%
                    </Button>
                  ))}
                </div>
              </div>

              {/* Fee Calculator */}
              {parseFloat(amount) > 0 && (
                <Card className="bg-muted/30 border-border/50">
                  <CardContent className="pt-4 space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      Transaction Details
                    </h4>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rate</span>
                        <span>1 {token.symbol} = {calculations.rate.toFixed(8)} ETH</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Percent className="w-3 h-3" />
                          Platform Fee (1%)
                        </span>
                        <span className="text-warning">{calculations.platformFee.toFixed(6)} ETH</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Fuel className="w-3 h-3" />
                          Est. Gas
                        </span>
                        <span>{calculations.estimatedGas.toFixed(6)} ETH</span>
                      </div>

                      {calculations.priceImpact > 1 && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Price Impact
                          </span>
                          <span className={calculations.priceImpact > 5 ? 'text-destructive' : 'text-warning'}>
                            {calculations.priceImpact.toFixed(2)}%
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between font-medium pt-2 border-t border-border/50">
                        <span>{activeTab === 'buy' ? 'Total Cost' : 'Gas Cost'}</span>
                        <span className="text-gradient-fire">
                          {calculations.totalCost.toFixed(6)} ETH
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No Token Selected */}
              {!tokenAddress && (
                <div className="text-center py-4">
                  <Coins className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    No token selected. Choose a token from the{' '}
                    <a href="/tokens" className="text-primary hover:underline">
                      explore page
                    </a>.
                  </p>
                </div>
              )}

              {/* Chain Not Supported */}
              {tokenAddress && !chainSupported && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Testnet Required</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Switch to Sepolia or Base Sepolia to trade.
                  </p>
                </div>
              )}

              {/* Transaction Error */}
              {txError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Transaction Failed</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {txError.message || 'An error occurred'}
                  </p>
                </div>
              )}

              {/* Trade Button */}
              {isConnected && tokenAddress ? (
                <Button
                  className={`w-full h-12 text-lg font-semibold ${
                    activeTab === 'buy'
                      ? 'bg-success hover:bg-success/90'
                      : needsApproval
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-destructive hover:bg-destructive/90'
                  }`}
                  disabled={!amount || parseFloat(amount) <= 0 || isLoading || !chainSupported}
                  onClick={handleTrade}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {isApproving || isApproveConfirming
                        ? 'Approving...'
                        : isBuying || isSelling
                        ? 'Confirm in Wallet...'
                        : 'Processing...'}
                    </>
                  ) : needsApproval ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Approve {token.symbol}
                    </>
                  ) : (
                    <>
                      {activeTab === 'buy' ? (
                        <>
                          <TrendingUp className="w-5 h-5 mr-2" />
                          Buy {token.symbol}
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-5 h-5 mr-2" />
                          Sell {token.symbol}
                        </>
                      )}
                    </>
                  )}
                </Button>
              ) : !isConnected ? (
                <ConnectButton />
              ) : null}

              {/* Info */}
              <p className="text-xs text-muted-foreground text-center">
                Trades are executed via bonding curve. Price updates in real-time.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Modal */}
      {txSuccess && lastTxHash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="max-w-md w-full mx-4 border-green-500/50">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Trade Successful! 🎉</h3>
              <p className="text-muted-foreground mb-4">
                Your {activeTab === 'buy' ? 'purchase' : 'sale'} of {token.symbol} has been completed.
              </p>
              
              <div className="p-3 bg-muted rounded-lg mb-4">
                <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                <a
                  href={getExplorerTxUrl(chainId, lastTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono text-primary hover:underline flex items-center justify-center gap-1"
                >
                  {lastTxHash.slice(0, 10)}...{lastTxHash.slice(-8)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <Button
                className="w-full"
                onClick={() => setTxSuccess(false)}
              >
                Continue Trading
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
