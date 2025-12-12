import React, { useEffect, useState } from 'react';
import { useChart } from '../../context/ChartContext';

export const OHLCBar: React.FC = () => {
    const { data, series } = useChart();
    const [currentCandle, setCurrentCandle] = useState<any>(null);

    useEffect(() => {
        if (!series || data.length === 0) return;

        // Get the last candle data
        const lastCandle = data[data.length - 1];
        if (lastCandle) {
            setCurrentCandle(lastCandle);
        }

        // Subscribe to crosshair move to show hovered candle data
        // This would require chart ref, which we'll add later for hover functionality
    }, [data, series]);

    if (!currentCandle) return null;

    const formatPrice = (price: number) => {
        return price.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 3
        });
    };

    const getChange = () => {
        if (data.length < 2) return { value: 0, percent: 0 };
        const prevClose = data[data.length - 2]?.close || currentCandle.open;
        const change = currentCandle.close - prevClose;
        const percent = (change / prevClose) * 100;
        return { value: change, percent };
    };

    const change = getChange();
    const isPositive = change.value >= 0;

    return (
        <div className="flex items-center px-4 py-2 bg-gray-50 dark:bg-[#1a1d28] border-b border-gray-200 dark:border-gray-800 text-sm">
            {/* Symbol and Source */}
            <div className="flex items-center space-x-2 mr-6">
                <span className="font-semibold text-gray-900 dark:text-white">BTCUSD</span>
                <span className="text-gray-500 dark:text-gray-400">·</span>
                <span className="text-gray-600 dark:text-gray-400">1D</span>
                <span className="text-gray-500 dark:text-gray-400">·</span>
                <span className="text-gray-600 dark:text-gray-400">Exchange Data</span>
            </div>

            {/* OHLC Data */}
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                    <span className="text-gray-500 dark:text-gray-500">O</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatPrice(currentCandle.open)}</span>
                </div>
                <div className="flex items-center space-x-1">
                    <span className="text-gray-500 dark:text-gray-500">H</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatPrice(currentCandle.high)}</span>
                </div>
                <div className="flex items-center space-x-1">
                    <span className="text-gray-500 dark:text-gray-500">L</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatPrice(currentCandle.low)}</span>
                </div>
                <div className="flex items-center space-x-1">
                    <span className="text-gray-500 dark:text-gray-500">C</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatPrice(currentCandle.close)}</span>
                </div>

                {/* Change */}
                <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    <span className="font-medium">{isPositive ? '+' : ''}{formatPrice(change.value)}</span>
                    <span className="font-medium">({isPositive ? '+' : ''}{change.percent.toFixed(2)}%)</span>
                </div>
            </div>
        </div>
    );
};
