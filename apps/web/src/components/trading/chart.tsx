'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, CandlestickData, Time } from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const timeframes = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '1H', value: '60' },
  { label: '4H', value: '240' },
  { label: '1D', value: '1440' },
];

// Generate mock candlestick data
function generateMockData(count: number = 100): CandlestickData[] {
  const data: CandlestickData[] = [];
  let basePrice = 0.0004;
  const now = Math.floor(Date.now() / 1000);
  const interval = 60 * 5; // 5 minutes

  for (let i = count; i >= 0; i--) {
    const time = (now - i * interval) as Time;
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * volatility;
    const open = basePrice;
    const close = basePrice * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);

    data.push({
      time,
      open,
      high,
      low,
      close,
    });

    basePrice = close;
  }

  return data;
}

export function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('5');
  const [chartType, setChartType] = useState<'candles' | 'line'>('candles');

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

    // Set data
    const data = generateMockData(100);
    candlestickSeries.setData(data);

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#f5af19',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Generate volume data
    const volumeData = data.map((candle) => ({
      time: candle.time,
      value: Math.random() * 10000 + 1000,
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
