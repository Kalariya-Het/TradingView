import React, { createContext, useContext, useState, useEffect } from 'react';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import axios from 'axios';
import { aggregateCandles } from '../utils/timeframeAggregation';

export type DrawingMode = 'cursor' | 'rectangle' | 'path' | 'fibonacci';

export type IndicatorType = 'SMA' | 'EMA' | 'RSI' | 'MACD';

export interface Indicator {
    id: string;
    type: IndicatorType;
    period?: number;
    color?: string;
}

export interface Point {
    time: number; // Unix timestamp
    price: number;
}

export interface Drawing {
    id: string;
    type: 'rectangle' | 'path' | 'fibonacci';
    points: Point[];
    color?: string;
}

interface Candle {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

type ChartContextType = {
    setChart: (chart: IChartApi) => void;
    setSeries: (series: ISeriesApi<"Candlestick">) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    screenshot: () => void;
    drawingMode: DrawingMode;
    setDrawingMode: (mode: DrawingMode) => void;
    data: Candle[];
    refreshData: () => void;
    indicators: Indicator[];
    addIndicator: (type: IndicatorType, period?: number, color?: string) => void;
    removeIndicator: (id: string) => void;
    drawings: Drawing[];
    addDrawing: (drawing: Drawing) => void;
    removeDrawing: (id: string) => void;
    undoDrawing: () => void;
    redoDrawing: () => void;
    clearAllDrawings: () => void;
    selectedDrawingId: string | null;
    setSelectedDrawing: (id: string | null) => void;
    series: ISeriesApi<"Candlestick"> | null;
    chart: IChartApi | null;
    loadState: (drawings: Drawing[], indicators: Indicator[]) => void;
    timeframe: string;
    setTimeframe: (tf: string) => void;
    rawData: Candle[];
    isFullscreen: boolean;
    toggleFullscreen: () => void;
};

const ChartContext = createContext<ChartContextType | undefined>(undefined);

export const ChartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [chart, setChartState] = useState<IChartApi | null>(null);
    const [series, setSeriesState] = useState<ISeriesApi<"Candlestick"> | null>(null);

    const [drawingMode, setDrawingMode] = useState<DrawingMode>('cursor');
    const [rawData, setRawData] = useState<Candle[]>([]);
    const [data, setData] = useState<Candle[]>([]);
    const [timeframe, setTimeframeState] = useState('1h');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [indicators, setIndicators] = useState<Indicator[]>([]);
    const [drawings, setDrawings] = useState<Drawing[]>([]);
    const [drawingHistory, setDrawingHistory] = useState<Drawing[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [selectedDrawingId, setSelectedDrawing] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('Fetching candles...');
                const res = await axios.get<Candle[]>('http://localhost:5000/api/candles');
                console.log('Raw data received:', res.data.length);

                // Filter invalid dates first
                const validData = res.data.filter(d => {
                    const isValid = !isNaN(new Date(d.timestamp).getTime());
                    if (!isValid) console.warn('Invalid timestamp:', d.timestamp);
                    return isValid;
                });
                console.log('Valid data count:', validData.length);

                // Sort by timestamp ascending
                const sortedData = validData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                // Remove duplicates
                const uniqueData = sortedData.filter((item, index, self) =>
                    index === 0 || new Date(item.timestamp).getTime() !== new Date(self[index - 1].timestamp).getTime()
                );
                console.log('Unique data count:', uniqueData.length);

                setRawData(uniqueData);
            } catch (e) {
                console.error('Failed to fetch data', e);
            }
        };
        fetchData();
    }, [refreshTrigger]);

    // Aggregate data when timeframe or rawData changes
    useEffect(() => {
        if (rawData.length === 0) {
            setData([]);
            return;
        }
        const aggregated = aggregateCandles(rawData, timeframe);
        console.log(`Aggregated from ${rawData.length} to ${aggregated.length} candles for ${timeframe}`);
        setData(aggregated);
    }, [rawData, timeframe]);

    // Handle keyboard shortcut for fullscreen (F key)
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'f' || e.key === 'F') {
                // Don't trigger if typing in input fields
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                    return;
                }
                e.preventDefault();
                setIsFullscreen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    const refreshData = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const setChart = (c: IChartApi) => {
        setChartState(c);
    };

    const setSeries = (s: ISeriesApi<"Candlestick">) => {
        setSeriesState(s);
    };

    const zoomIn = () => {
        if (chart) {
            const timeScale = chart.timeScale();
            const logicalRange = timeScale.getVisibleLogicalRange();
            if (logicalRange) {
                const span = logicalRange.to - logicalRange.from;
                const newSpan = span * 0.8;
                const center = (logicalRange.to + logicalRange.from) / 2;
                timeScale.setVisibleLogicalRange({
                    from: center - newSpan / 2,
                    to: center + newSpan / 2,
                });
            }
        }
    };

    const zoomOut = () => {
        if (chart) {
            const timeScale = chart.timeScale();
            const logicalRange = timeScale.getVisibleLogicalRange();
            if (logicalRange) {
                const span = logicalRange.to - logicalRange.from;
                const newSpan = span * 1.25;
                const center = (logicalRange.to + logicalRange.from) / 2;
                timeScale.setVisibleLogicalRange({
                    from: center - newSpan / 2,
                    to: center + newSpan / 2,
                });
            }
        }
    };

    const screenshot = () => {
        if (chart) {
            const canvas = chart.takeScreenshot();
            const link = document.createElement('a');
            link.download = 'chart.png';
            link.href = canvas.toDataURL();
            link.click();
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(prev => !prev);
    };

    const addIndicator = (type: IndicatorType, period?: number, color?: string) => {
        const newInd: Indicator = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            period,
            color
        };
        setIndicators([...indicators, newInd]);
    };

    const removeIndicator = (id: string) => {
        setIndicators(indicators.filter(i => i.id !== id));
    };

    const addDrawing = (drawing: Drawing) => {
        const newDrawings = [...drawings, drawing];
        setDrawings(newDrawings);
        // Update history
        const newHistory = drawingHistory.slice(0, historyIndex + 1);
        newHistory.push(newDrawings);
        setDrawingHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const removeDrawing = (id: string) => {
        const newDrawings = drawings.filter(d => d.id !== id);
        setDrawings(newDrawings);
        // Update history
        const newHistory = drawingHistory.slice(0, historyIndex + 1);
        newHistory.push(newDrawings);
        setDrawingHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        if (selectedDrawingId === id) {
            setSelectedDrawing(null);
        }
    };

    const undoDrawing = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setDrawings(drawingHistory[newIndex]);
            setSelectedDrawing(null);
        }
    };

    const redoDrawing = () => {
        if (historyIndex < drawingHistory.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setDrawings(drawingHistory[newIndex]);
            setSelectedDrawing(null);
        }
    };

    const clearAllDrawings = () => {
        setDrawings([]);
        const newHistory = drawingHistory.slice(0, historyIndex + 1);
        newHistory.push([]);
        setDrawingHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setSelectedDrawing(null);
    };

    const setTimeframe = (tf: string) => {
        setTimeframeState(tf);
    };

    const loadState = (newDrawings: Drawing[], newIndicators: Indicator[]) => {
        setDrawings(newDrawings);
        setIndicators(newIndicators);
    };

    return (
        <ChartContext.Provider value={{
            setChart,
            setSeries,
            zoomIn,
            zoomOut,
            screenshot,
            drawingMode,
            setDrawingMode,
            data,
            refreshData,
            indicators,
            addIndicator,
            removeIndicator,
            drawings,
            addDrawing,
            removeDrawing,
            undoDrawing,
            redoDrawing,
            clearAllDrawings,
            selectedDrawingId,
            setSelectedDrawing,
            series,
            chart,
            loadState,
            timeframe,
            setTimeframe,
            rawData,
            isFullscreen,
            toggleFullscreen
        }}>
            {children}
        </ChartContext.Provider>
    );
};

export const useChart = () => {
    const ctx = useContext(ChartContext);
    if (!ctx) {
        throw new Error('useChart must be used within a ChartProvider');
    }
    return ctx;
};
