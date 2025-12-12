import React, { useEffect, useState } from 'react';
import { useChart } from '../../context/ChartContext';

interface CandleData {
    timestamp: string | number;
    open: number;
    high: number;
    low: number;
    close: number;
}

export const ChartOHLCOverlay: React.FC = () => {
    const { data, chart, series } = useChart();
    const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);

    useEffect(() => {
        if (!chart || !data || data.length === 0) {
            return;
        }

        const lastCandle = data[data.length - 1];
        setHoveredCandle(lastCandle);

        const handleCrosshairMove = (param: any) => {
            if (!param.time || !data) {
                setHoveredCandle(data[data.length - 1]);
                return;
            }

            const timeValue = typeof param.time === 'number' ? param.time : new Date(param.time).getTime() / 1000;
            const candle = data.find(d => {
                const candleTime = new Date(d.timestamp).getTime() / 1000;
                return Math.abs(candleTime - timeValue) < 86400;
            });

            if (candle) {
                setHoveredCandle(candle);
            }
        };

        chart.subscribeCrosshairMove(handleCrosshairMove);

        return () => {
            chart.unsubscribeCrosshairMove(handleCrosshairMove);
        };
    }, [chart, series, data]);

    const formatPrice = (price: number) => {
        return price.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const getChange = () => {
        if (!hoveredCandle || !data || data.length < 2) return { value: 0, percent: 0 };
        const currentIndex = data.findIndex(d => d.timestamp === hoveredCandle.timestamp);
        if (currentIndex <= 0) return { value: 0, percent: 0 };

        const prevClose = data[currentIndex - 1]?.close || hoveredCandle.open;
        const change = hoveredCandle.close - prevClose;
        const percent = (change / prevClose) * 100;
        return { value: change, percent };
    };

    if (!hoveredCandle) {
        return null;
    }

    const change = getChange();
    const isPositive = change.value >= 0;

    return (
        <div
            style={{
                position: 'fixed',
                top: '10px',
                left: '10px',
                zIndex: 999999,
                pointerEvents: 'none'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '13px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    border: '2px solid #e5e7eb'
                }}
            >
                {/* Symbol and Info */}
                <span style={{ fontWeight: 600, color: '#111827' }}>Gold Spot / U.S. Dollar</span>
                <span style={{ color: '#9ca3af' }}>·</span>
                <span style={{ color: '#374151' }}>1D</span>
                <span style={{ color: '#9ca3af' }}>·</span>
                <span style={{ color: '#374151' }}>OANDA</span>

                {/* OHLC Data */}
                <span style={{ color: '#6b7280' }}>O</span>
                <span style={{ fontWeight: 600, color: '#000' }}>{formatPrice(hoveredCandle.open)}</span>

                <span style={{ color: '#6b7280' }}>H</span>
                <span style={{ fontWeight: 600, color: '#000' }}>{formatPrice(hoveredCandle.high)}</span>

                <span style={{ color: '#6b7280' }}>L</span>
                <span style={{ fontWeight: 600, color: '#000' }}>{formatPrice(hoveredCandle.low)}</span>

                <span style={{ color: '#6b7280' }}>C</span>
                <span style={{ fontWeight: 600, color: '#000' }}>{formatPrice(hoveredCandle.close)}</span>

                {/* Change */}
                <span style={{ fontWeight: 600, color: isPositive ? '#16a34a' : '#dc2626' }}>
                    {isPositive ? '+' : ''}{formatPrice(Math.abs(change.value))}
                </span>
                <span style={{ fontWeight: 600, color: isPositive ? '#16a34a' : '#dc2626' }}>
                    ({isPositive ? '+' : ''}{Math.abs(change.percent).toFixed(2)}%)
                </span>
            </div>
        </div>
    );
};
