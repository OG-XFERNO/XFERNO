'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, ColorType, IChartApi, CandlestickData, Time, ISeriesApi, SeriesType } from 'lightweight-charts';
import { useChainId } from 'wagmi';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePriceCandles, intervalToApiFormat, type PriceCandle } from '@/lib/api/trading';
import { Loader2 } from 'lucide-react';

const timeframes = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '1H', value: '60' },
  { label: '4H', value: '240' },
  { label: '1D', value: '1440' },
];

// Generate mock candlestick data (fallback when no real data)
function generateMockData(count: number = 100, basePrice: number = 0.0001): CandlestickData[] {
  const data: CandlestickData[] = [];
  let price = basePrice;
  const now = Math.floor(Date.now() / 1000);
  const interval = 60 * 5; // 5 minutes

  for (let i = count; i >= 0; i--) {
    const time = (now - i * interval) as Time;
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * volatility;
    const open = price;
    const close = price * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);

    data.push({ time, open, high, low, close });
    price = close;
  }

  return data;
}

// Convert API candles to chart format
function apiCandlesToChartData(candles: PriceCandle[]): CandlestickData[] {
  return candles.map((c) => ({
    time: c.time as Time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }));
}

interface TradingChartProps {
  tokenAddress?: string;
  currentPrice?: number;
}

export function TradingChart({ tokenAddress, currentPrice }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('5');
  const [chartType, setChartType] = useState<'candles' | 'line'>('candles');
  const chainId = useChainId();

  // Fetch real candle data from API
  const interval = intervalToApiFormat(selectedTimeframe);
  const { data: apiCandles, isLoading } = usePriceCandles(tokenAddress, chainId, interval);

  // Convert API data or use mock data
  const chartData = useMemo(() => {
    if (apiCandles && apiCandles.length > 0) {
      return apiCandlesToChartData(apiCandles);
    }
    // Fall back to mock data with current price as base
    return generateMockData(100, currentPrice || 0.0001);
  }, [apiCandles, currentPrice]);

  const hasRealData = apiCandles && apiCandles.length > 0;

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Chart configuration matching XFERNO theme
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#a1a1aa',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#f5af19',
          width: 1,
          style: 2,
          labelBackgroundColor: '#f5af19',
        },
        horzLine: {
          color: '#f5af19',
          width: 1,
          style: 2,
          labelBackgroundColor: '#f5af19',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    // Add candlestick series with fire gradient colors
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    candleSeriesRef.current = candlestickSeries;

    // Set data from API or mock
    candlestickSeries.setData(chartData);

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#f5af19',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    volumeSeriesRef.current = volumeSeries;

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Generate volume data from candles
    const volumeData = chartData.map((candle) => ({
      time: candle.time,
      value: hasRealData ? (apiCandles?.find(c => c.time === (candle.time as number))?.volume || 1000) : Math.random() * 10000 + 1000,
      color: candle.close >= candle.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
    }));

    volumeSeries.setData(volumeData);

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: 400,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [selectedTimeframe, chartData, hasRealData, apiCandles]);

  return (
    <div className="w-full">
      {/* Chart Controls */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-1">
          {timeframes.map((tf) => (
            <Button
              key={tf.value}
              variant={selectedTimeframe === tf.value ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'h-7 px-2 text-xs',
                selectedTimeframe === tf.value && 'bg-gradient-fire'
              )}
              onClick={() => setSelectedTimeframe(tf.value)}
            >
              {tf.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {/* Data source indicator */}
          <span className={cn(
            'text-xs px-2 py-0.5 rounded',
            hasRealData 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-yellow-500/20 text-yellow-400'
          )}>
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
            ) : hasRealData ? (
              '● Live'
            ) : (
              '◌ Demo'
            )}
          </span>
          <Button
            variant={chartType === 'candles' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setChartType('candles')}
          >
            Candles
          </Button>
          <Button
            variant={chartType === 'line' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setChartType('line')}
          >
            Line
          </Button>
        </div>
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} className="w-full h-[400px]" />
    </div>
  );
}
