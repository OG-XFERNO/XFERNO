'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, CandlestickData, Time, ISeriesApi, LineData } from 'lightweight-charts';
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

// Convert API candles to candlestick format
function apiCandlesToChartData(candles: PriceCandle[]): CandlestickData[] {
  return candles.map((c) => ({
    time: c.time as Time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }));
}

// Convert API candles to line format
function apiCandlesToLineData(candles: PriceCandle[]): LineData[] {
  return candles.map((c) => ({
    time: c.time as Time,
    value: c.close,
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
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const lastDataHash = useRef<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('5');
  const [chartType, setChartType] = useState<'candles' | 'line'>('candles');
  const chainId = useChainId();

  // Fetch real candle data from API with 2-second polling
  const interval = intervalToApiFormat(selectedTimeframe);
  const { data: apiCandles, isLoading, refetch } = usePriceCandles(tokenAddress, chainId, interval, {
    refetchInterval: 2000,
    refetchIntervalInBackground: false,
  });

  const hasRealData = apiCandles && apiCandles.length > 0;

  // Create chart on mount, recreate on chartType change
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      lineSeriesRef.current = null;
      volumeSeriesRef.current = null;
    }

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
          bottom: 0.2,
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

    // Add main series based on chart type
    if (chartType === 'candles') {
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });
      candleSeriesRef.current = candlestickSeries;
    } else {
      const lineSeries = chart.addLineSeries({
        color: '#f5af19',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      });
      lineSeriesRef.current = lineSeries;
    }

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#f5af19',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    volumeSeriesRef.current = volumeSeries;

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

    // Reset data hash to load data
    lastDataHash.current = '';

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [chartType]);

  // Update data when candles change
  useEffect(() => {
    if (!chartRef.current || !apiCandles || apiCandles.length === 0) return;

    // Create hash to check if data changed
    const dataHash = `${chartType}-${selectedTimeframe}-${JSON.stringify(apiCandles.slice(-3).map(c => `${c.time}-${c.close}`))}`;
    if (dataHash === lastDataHash.current) return;
    lastDataHash.current = dataHash;

    // Update the appropriate series
    if (chartType === 'candles' && candleSeriesRef.current) {
      const chartData = apiCandlesToChartData(apiCandles);
      candleSeriesRef.current.setData(chartData);
    } else if (chartType === 'line' && lineSeriesRef.current) {
      const lineData = apiCandlesToLineData(apiCandles);
      lineSeriesRef.current.setData(lineData);
    }

    // Update volume
    if (volumeSeriesRef.current) {
      const volumeData = apiCandles.map((c) => ({
        time: c.time as Time,
        value: c.volume || 1000,
        color: c.close >= c.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
      }));
      volumeSeriesRef.current.setData(volumeData);
    }

    // Fit content
    chartRef.current.timeScale().fitContent();
  }, [apiCandles, chartType, selectedTimeframe]);

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: string) => {
    setSelectedTimeframe(newTimeframe);
    lastDataHash.current = ''; // Force data reload
    // Clear current data immediately
    if (candleSeriesRef.current) candleSeriesRef.current.setData([]);
    if (lineSeriesRef.current) lineSeriesRef.current.setData([]);
    if (volumeSeriesRef.current) volumeSeriesRef.current.setData([]);
  };

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
              onClick={() => handleTimeframeChange(tf.value)}
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
