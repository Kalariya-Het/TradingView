import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { useChart } from '../../context/ChartContext';
import { SMA, EMA, RSI, MACD } from 'technicalindicators';

import { DrawingOverlay } from '../Overlay/DrawingOverlay';

export const ChartContainer: React.FC = () => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const indicatorSeriesRef = useRef<Map<string, ISeriesApi<any>[]>>(new Map());
    const { setChart, setSeries, data, indicators } = useChart();

    // Initialize chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight,
                });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#d1d4dc',
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { visible: false },
            },
            rightPriceScale: {
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
        });

        chartRef.current = chart;
        setChart(chart);

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderUpColor: '#26a69a',
            borderDownColor: '#ef5350',
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });

        seriesRef.current = candleSeries;
        setSeries(candleSeries);

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            setChart(null as any);
            setSeries(null as any);
        };
    }, []);

    // Update data
    useEffect(() => {
        if (!seriesRef.current || data.length === 0) return;

        const formatted = data.map((c) => ({
            time: (new Date(c.timestamp).getTime() / 1000) as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
        }));

        seriesRef.current.setData(formatted);
        chartRef.current?.timeScale().fitContent();
    }, [data]);

    // Handle Indicators
    useEffect(() => {
        if (!chartRef.current || data.length === 0) return;

        // Cleanup old indicators
        const activeIds = new Set(indicators.map(i => i.id));
        indicatorSeriesRef.current.forEach((seriesList, id) => {
            if (!activeIds.has(id)) {
                seriesList.forEach(s => chartRef.current?.removeSeries(s));
                indicatorSeriesRef.current.delete(id);
            }
        });

        // Add/Update indicators
        indicators.forEach(ind => {
            if (indicatorSeriesRef.current.has(ind.id)) return;

            const closePrices = data.map(d => d.close);
            const timestamps = data.map(d => (new Date(d.timestamp).getTime() / 1000) as Time);
            let newSeriesList: ISeriesApi<any>[] = [];

            if (ind.type === 'SMA' || ind.type === 'EMA') {
                const period = ind.period || 14;
                const result = ind.type === 'SMA'
                    ? SMA.calculate({ period, values: closePrices })
                    : EMA.calculate({ period, values: closePrices });

                const offset = period - 1;
                const lineData = result.map((val, i) => ({
                    time: timestamps[i + offset],
                    value: val,
                }));

                const series = chartRef.current!.addSeries(LineSeries, {
                    color: ind.color || (ind.type === 'SMA' ? 'blue' : 'orange'),
                    lineWidth: 2,
                    priceScaleId: 'right',
                });
                series.setData(lineData);
                newSeriesList.push(series);
            }
            // ... (Keep RSI/MACD logic if needed, but simplifying for now to ensure chart works)
            else if (ind.type === 'RSI') {
                const period = ind.period || 14;
                const result = RSI.calculate({ period, values: closePrices });
                const lineData = result.map((val, i) => ({
                    time: timestamps[i + (data.length - result.length)],
                    value: val,
                }));
                const series = chartRef.current!.addSeries(LineSeries, {
                    color: ind.color || 'purple',
                    lineWidth: 2,
                    priceScaleId: ind.id,
                });
                chartRef.current!.priceScale(ind.id).applyOptions({
                    scaleMargins: { top: 0.75, bottom: 0 },
                });
                series.setData(lineData);
                newSeriesList.push(series);
            }
            else if (ind.type === 'MACD') {
                const macdInput = {
                    values: closePrices,
                    fastPeriod: 12,
                    slowPeriod: 26,
                    signalPeriod: 9,
                    SimpleMAOscillator: false,
                    SimpleMASignal: false,
                };
                const result = MACD.calculate(macdInput);
                const startIndex = data.length - result.length;

                const macdSeries = chartRef.current!.addSeries(LineSeries, { color: 'blue', lineWidth: 2, priceScaleId: ind.id });
                const signalSeries = chartRef.current!.addSeries(LineSeries, { color: 'orange', lineWidth: 2, priceScaleId: ind.id });
                const histogramSeries = chartRef.current!.addSeries(HistogramSeries, { color: 'gray', priceScaleId: ind.id });

                chartRef.current!.priceScale(ind.id).applyOptions({ scaleMargins: { top: 0.75, bottom: 0 } });

                macdSeries.setData(result.map((v, i) => ({ time: timestamps[startIndex + i], value: v.MACD })));
                signalSeries.setData(result.map((v, i) => ({ time: timestamps[startIndex + i], value: v.signal })));
                histogramSeries.setData(result.map((v, i) => ({
                    time: timestamps[startIndex + i],
                    value: v.histogram,
                    color: (v.histogram || 0) > 0 ? '#26a69a' : '#ef5350'
                })));

                newSeriesList.push(macdSeries, signalSeries, histogramSeries);
            }

            indicatorSeriesRef.current.set(ind.id, newSeriesList);
        });
    }, [indicators, data]);

    // Dark mode
    useEffect(() => {
        if (!chartRef.current) return;
        const isDark = document.documentElement.classList.contains('dark');
        chartRef.current.applyOptions({
            layout: {
                background: { type: ColorType.Solid, color: isDark ? '#1e1e1e' : '#ffffff' },
                textColor: isDark ? '#e0e0e0' : '#000000',
            },
        });
    }, []);

    return (
        <div className="w-full h-full relative">
            <div ref={chartContainerRef} className="w-full h-full" />
            <DrawingOverlay />
        </div>
    );
};
