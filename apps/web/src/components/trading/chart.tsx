'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, IChartApi, CandlestickData, Time, ISeriesApi } from 'lightweight-charts';
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
  const isChartInitialized = useRef(false);
  const lastDataHash = useRef<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('5');
  const [chartType, setChartType] = useState<'candles' | 'line'>('candles');
  const chainId = useChainId();

  // Fetch real candle data from API with 1-second polling
  const interval = intervalToApiFormat(selectedTimeframe);
  const { data: apiCandles, isLoading } = usePriceCandles(tokenAddress, chainId, interval, {
    refetchInterval: 1000, // Poll every 1 second
    refetchIntervalInBackground: false, // Don't poll when tab is hidden
  });

  const hasRealData = apiCandles && apiCandles.length > 0;

  // Initialize chart only once
  useEffect(() => {
    if (!chartContainerRef.current || isChartInitialized.current) return;

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

    isChartInitialized.current = true;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
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
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      isChartInitialized.current = false;
      lastDataHash.current = '';
    };
  }, []);

  // Update data without recreating chart (smooth updates)
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !apiCandles) return;

    // Create a hash to check if data actually changed
    const dataHash = JSON.stringify(apiCandles.map(c => `${c.time}-${c.close}`));
    if (dataHash === lastDataHash.current) return; // Skip if no change
    lastDataHash.current = dataHash;

    const chartData = apiCandlesToChartData(apiCandles);
    
    // Update candlestick data
    candleSeriesRef.current.setData(chartData);

    // Update volume data
    const volumeData = chartData.map((candle) => ({
      time: candle.time,
      value: apiCandles?.find(c => c.time === (candle.time as number))?.volume || 1000,
      color: candle.close >= candle.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
    }));

    volumeSeriesRef.current.setData(volumeData);

    // Only fit content on first data load
    if (chartRef.current && chartData.length > 0) {
      chartRef.current.timeScale().fitContent();
    }
  }, [apiCandles]);

  // Handle timeframe change - reset chart data
  useEffect(() => {
    if (candleSeriesRef.current) {
      candleSeriesRef.current.setData([]);
    }
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData([]);
    }
    lastDataHash.current = ''; // Reset hash to allow new data
  }, [selectedTimeframe]);

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
      <div className="relative">
        <div ref={chartContainerRef} className="w-full h-[400px]" />
        
        {/* Empty state overlay */}
        {!isLoading && !hasRealData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-muted-foreground text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-sm font-medium">No Trading Data Yet</p>
              <p className="text-xs mt-1">Chart will populate after the first trade</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
