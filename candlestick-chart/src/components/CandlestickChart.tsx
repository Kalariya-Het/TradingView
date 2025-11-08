import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  ColorType,
  CrosshairMode,
  PriceScaleMode,
  CandlestickSeries,
  HistogramSeries,
} from 'lightweight-charts';
import { OHLCVData, ChartSettings } from '../types';
import { aggregateData, calculateAutoTimeframe } from '../utils/dataAggregation';
import { downsampleAdaptive } from '../utils/downsampling';

interface CandlestickChartProps {
  data: OHLCVData[];
  settings: ChartSettings;
  width?: number;
  height?: number;
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data,
  settings,
  width = 800,
  height = 600,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  const [processedData, setProcessedData] = useState<{
    candlestick: CandlestickData[];
    volume: HistogramData[];
  }>({ candlestick: [], volume: [] });

  // Process data when data or settings change
  useEffect(() => {
    if (data.length === 0) {
      setProcessedData({ candlestick: [], volume: [] });
      return;
    }

    // Determine timeframe
    const actualTimeframe = settings.timeframe === 'auto'
      ? calculateAutoTimeframe(data)
      : settings.timeframe;

    // Aggregate data
    const aggregatedData = aggregateData(data, actualTimeframe);

    // Downsample for performance (target ~2000 points for smooth interaction)
    const downsampledData = downsampleAdaptive(aggregatedData, 2000);

    // Convert to chart format
    const candlestickData: CandlestickData[] = downsampledData.map(item => ({
      time: item.timestamp / 1000 as any, // Lightweight-charts expects seconds
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }));

    const volumeData: HistogramData[] = downsampledData
      .filter(item => item.volume !== undefined)
      .map(item => ({
        time: item.timestamp / 1000 as any,
        value: item.volume!,
        color: item.close >= item.open ? '#26a69a' : '#ef5350',
      }));

    setProcessedData({ candlestick: candlestickData, volume: volumeData });
  }, [data, settings]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width,
      height,
      layout: {
        background: {
          type: ColorType.Solid,
          color: settings.theme === 'dark' ? '#1e1e1e' : '#ffffff',
        },
        textColor: settings.theme === 'dark' ? '#d1d4dc' : '#191919',
      },
      grid: {
        vertLines: {
          color: settings.theme === 'dark' ? '#2a2e39' : '#e1ecf2',
        },
        horzLines: {
          color: settings.theme === 'dark' ? '#2a2e39' : '#e1ecf2',
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        mode: settings.isLogScale ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Handle fullscreen changes
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        // In fullscreen mode
        chart.applyOptions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      } else {
        // Exit fullscreen mode
        chart.applyOptions({
          width,
          height,
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Create candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Create volume series if enabled
    let volumeSeries: ISeriesApi<'Histogram'> | null = null;
    if (settings.showVolume) {
      volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '', // Use separate price scale
      });
      chart.priceScale('').applyOptions({
        scaleMargins: {
          top: 0.7,
          bottom: 0,
        },
      });
    }

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    // Set up crosshair tooltip
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData.size) return;

      const candlestickData = param.seriesData.get(candlestickSeries) as CandlestickData;
      if (candlestickData) {
        // Tooltip logic can be handled by parent component
      }
    });

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      chart.remove();
    };
  }, [width, height, settings.theme, settings.isLogScale, settings.showVolume]);

  // Update data
  useEffect(() => {
    if (candlestickSeriesRef.current && processedData.candlestick.length > 0) {
      candlestickSeriesRef.current.setData(processedData.candlestick);
    }

    if (volumeSeriesRef.current && processedData.volume.length > 0) {
      volumeSeriesRef.current.setData(processedData.volume);
    }

    // Fit the chart to show all data
    if (chartRef.current && (processedData.candlestick.length > 0 || processedData.volume.length > 0)) {
      chartRef.current.timeScale().fitContent();
    }
  }, [processedData]);

  // Update theme
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({
        layout: {
          background: {
            type: ColorType.Solid,
            color: settings.theme === 'dark' ? '#1e1e1e' : '#ffffff',
          },
          textColor: settings.theme === 'dark' ? '#d1d4dc' : '#191919',
        },
        grid: {
          vertLines: {
            color: settings.theme === 'dark' ? '#2a2e39' : '#e1ecf2',
          },
          horzLines: {
            color: settings.theme === 'dark' ? '#2a2e39' : '#e1ecf2',
          },
        },
      });
    }
  }, [settings.theme]);

  // Update scale mode
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({
        rightPriceScale: {
          mode: settings.isLogScale ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
        },
      });
    }
  }, [settings.isLogScale]);

  // Handle volume series visibility
  useEffect(() => {
    if (!chartRef.current) return;

    if (settings.showVolume && !volumeSeriesRef.current) {
      const volumeSeries = chartRef.current.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
      });
      chartRef.current.priceScale('').applyOptions({
        scaleMargins: {
          top: 0.7,
          bottom: 0,
        },
      });
      volumeSeries.setData(processedData.volume);
      volumeSeriesRef.current = volumeSeries;
    } else if (!settings.showVolume && volumeSeriesRef.current) {
      chartRef.current.removeSeries(volumeSeriesRef.current);
      volumeSeriesRef.current = null;
    }
  }, [settings.showVolume, processedData.volume]);

  const resetView = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  };

  const toggleFullscreen = () => {
    if (!chartContainerRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      chartContainerRef.current.requestFullscreen().then(() => {
        // Update chart size to fullscreen dimensions
        if (chartRef.current) {
          chartRef.current.applyOptions({
            width: window.innerWidth,
            height: window.innerHeight,
          });
        }
      });
    }
  };

  // Expose methods for parent component
  // Note: useImperativeHandle removed as it was causing type issues

  return (
    <div
      ref={chartContainerRef}
      className="relative"
      style={{ width, height }}
      tabIndex={0}
      onKeyDown={(e) => {
        // Keyboard navigation
        if (e.key === 'r' || e.key === 'R') {
          resetView();
        } else if (e.key === 'f' || e.key === 'F') {
          toggleFullscreen();
        }
      }}
      aria-label="Candlestick chart"
    />
  );
};

export default CandlestickChart;