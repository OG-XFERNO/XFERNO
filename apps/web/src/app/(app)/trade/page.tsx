'use client';

import { useState, useMemo } from 'react';
import { useAccount, useBalance, useChainId, useGasPrice } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import { formatEther, parseEther, type Address } from 'viem';
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
} from '@/lib/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ConnectButton } from '@/components/wallet/connect-button';
import { TradingChart } from '@/components/trading/chart';
import { OrderBook } from '@/components/trading/order-book';
import { RecentTrades } from '@/components/trading/recent-trades';
import { PLATFORM_FEE_BPS, chainMetadata, GAS_MULTIPLIERS } from '@/lib/wagmi';
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
} from 'lucide-react';

// Default mock token data - used when no token is selected
const defaultToken = {
  address: '0x1234567890abcdef1234567890abcdef12345678' as Address,
  name: 'Example Token',
  symbol: 'EXMPL',
  price: 0.00042,
  priceChange24h: 12.5,
  volume24h: 125000,
  marketCap: 420000,
  liquidity: 85000,
};

export default function TradePage() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token');
  const tokenAddress = tokenParam as Address | undefined;

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: ethBalance } = useBalance({ address });
  const { data: gasPrice } = useGasPrice();

  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);

  // Contract addresses
  const contractAddresses = getContractAddresses(chainId);

  // Token info from contract
  const tokenInfo = useTokenInfo(tokenAddress);
  const { data: tokenBalanceData } = useTokenBalance(tokenAddress, address);
  const { data: tokenState } = useTokenState(tokenAddress);
  const { data: currentPrice } = useCurrentPrice(tokenAddress);
  const { data: curveParams } = useCurveParams();
  const { data: allowance } = useTokenAllowance(
    tokenAddress,
    address,
    contractAddresses?.bondingCurve
  );

  // Trading hooks
  const { buy, isPending: isBuying, isConfirming: isBuyConfirming, isSuccess: buySuccess } = useBuyTokens();
  const { sell, isPending: isSelling, isConfirming: isSellConfirming, isSuccess: sellSuccess } = useSellTokens();
  const { approve, isPending: isApproving, isConfirming: isApproveConfirming } = useApproveToken();

  // Determine which token data to use
  const token = tokenAddress && tokenInfo.name ? {
    address: tokenAddress,
    name: tokenInfo.name,
    symbol: tokenInfo.symbol || 'TOKEN',
    price: currentPrice ? parseFloat(formatEther(currentPrice)) : defaultToken.price,
    priceChange24h: defaultToken.priceChange24h, // Would need price history
    volume24h: defaultToken.volume24h, // Would need indexer
    marketCap: tokenState ? parseFloat(formatEther(tokenState.ethReserve)) : defaultToken.marketCap,
    liquidity: tokenState ? parseFloat(formatEther(tokenState.ethReserve)) : defaultToken.liquidity,
  } : defaultToken;

  // Token balance
  const tokenBalance = tokenBalanceData ? parseFloat(formatEther(tokenBalanceData)) : 0;

  // Check if approval is needed for selling
  const needsApproval = activeTab === 'sell' && 
    tokenAddress && 
    contractAddresses?.bondingCurve &&
    allowance !== undefined && 
    parseFloat(amount || '0') > 0 &&
    allowance < parseEther(amount || '0');

  const isLoading = isBuying || isBuyConfirming || isSelling || isSellConfirming || isApproving || isApproveConfirming;

  // Real-time calculations
  const calculations = useMemo(() => {
    const inputAmount = parseFloat(amount) || 0;
    const tokenPrice = token.price;
    const platformFeePercent = curveParams ? Number(curveParams.feeBps) / 10000 : 0.01;
    const gasMultiplier = GAS_MULTIPLIERS[chainId] || 1.2;

    // Gas estimation (mock - would be real estimate in production)
    const estimatedGasUnits = activeTab === 'buy' ? BigInt(150000) : BigInt(120000);
    const gasPriceWei = gasPrice || BigInt(20000000000); // 20 gwei fallback
    const estimatedGasWei = estimatedGasUnits * gasPriceWei * BigInt(Math.floor(gasMultiplier * 100)) / BigInt(100);
    const estimatedGasEth = parseFloat(formatEther(estimatedGasWei));

    if (activeTab === 'buy') {
      // Buying tokens with ETH
      const tokensReceived = inputAmount / tokenPrice;
      const platformFee = inputAmount * platformFeePercent;
      const totalCost = inputAmount + platformFee + estimatedGasEth;
      const priceImpact = (inputAmount / token.liquidity) * 100;

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
      // Selling tokens for ETH
      const ethReceived = inputAmount * tokenPrice;
      const platformFee = ethReceived * platformFeePercent;
      const netReceived = ethReceived - platformFee;
      const priceImpact = (ethReceived / token.liquidity) * 100;

      return {
        inputAmount,
        outputAmount: netReceived,
        platformFee,
        estimatedGas: estimatedGasEth,
        totalCost: estimatedGasEth, // Only gas for selling
        priceImpact,
        rate: tokenPrice,
      };
    }
  }, [amount, activeTab, chainId, gasPrice, token.price, token.liquidity, curveParams]);

  const handlePercentageClick = (percent: number) => {
    if (activeTab === 'buy' && ethBalance) {
      const maxAmount = parseFloat(ethBalance.formatted) * (percent / 100);
      setAmount(maxAmount.toFixed(6));
    } else if (activeTab === 'sell') {
      const maxAmount = tokenBalance * (percent / 100);
      setAmount(maxAmount.toFixed(2));
    }
  };

  const handleTrade = async () => {
    if (!isConnected || !amount || !tokenAddress) return;

    const parsedAmount = parseEther(amount);
    const slippageMultiplier = BigInt(Math.floor((100 - slippage) * 100)); // e.g., 99.5% -> 9950

    try {
      if (activeTab === 'buy') {
        // Calculate minimum tokens to receive with slippage
        const minTokens = (parsedAmount * slippageMultiplier) / BigInt(10000);
        
        await buy({
          token: tokenAddress,
          minTokens,
          value: parsedAmount,
        });
      } else {
        // For selling, check if we need approval first
        if (needsApproval && contractAddresses?.bondingCurve) {
          await approve({
            token: tokenAddress,
            spender: contractAddresses.bondingCurve,
            amount: parsedAmount,
          });
          return; // Wait for approval to complete, then user can try again
        }

        // Calculate minimum ETH to receive with slippage
        const expectedEth = parseEther(calculations.outputAmount.toString());
        const minEth = (expectedEth * slippageMultiplier) / BigInt(10000);

        await sell({
          token: tokenAddress,
          tokenAmount: parsedAmount,
          minEth,
        });
      }
    } catch (err) {
      console.error('Trade failed:', err);
    }
  };

  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

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
                  <div className="w-12 h-12 rounded-full bg-gradient-fire flex items-center justify-center text-white font-bold">
                    {token.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                      {token.name}
                      <Badge variant="outline">{token.symbol}</Badge>
                    </h1>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-2xl font-bold">
                        ${token.price.toFixed(6)}
                      </span>
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
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 sm:gap-6 text-sm">
                  <div className="min-w-[80px]">
                    <p className="text-muted-foreground text-xs sm:text-sm">Market Cap</p>
                    <p className="font-medium">${formatNumber(token.marketCap)}</p>
                  </div>
                  <div className="min-w-[80px]">
                    <p className="text-muted-foreground text-xs sm:text-sm">24h Volume</p>
                    <p className="font-medium">${formatNumber(token.volume24h)}</p>
                  </div>
                  <div className="min-w-[80px]">
                    <p className="text-muted-foreground text-xs sm:text-sm">Liquidity</p>
                    <p className="font-medium">${formatNumber(token.liquidity)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="p-0">
              <TradingChart />
            </CardContent>
          </Card>

          {/* Order Book & Recent Trades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <OrderBook />
            <RecentTrades />
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
                        Balance: {ethBalance ? parseFloat(ethBalance.formatted).toFixed(4) : '0'} ETH
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
                        Balance: {formatNumber(tokenBalance)} {token.symbol}
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

              {/* Trade Button */}
              {isConnected ? (
                <Button
                  className={`w-full h-12 text-lg font-semibold ${
                    activeTab === 'buy'
                      ? 'bg-success hover:bg-success/90'
                      : 'bg-destructive hover:bg-destructive/90'
                  }`}
                  disabled={!amount || parseFloat(amount) <= 0 || isLoading}
                  onClick={handleTrade}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
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
              ) : (
                <ConnectButton />
              )}

              {/* Info */}
              <p className="text-xs text-muted-foreground text-center">
                Trades are executed via bonding curve. Price updates in real-time.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
