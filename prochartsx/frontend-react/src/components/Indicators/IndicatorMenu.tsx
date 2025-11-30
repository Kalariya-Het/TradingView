import React, { useState } from 'react';
import { useChart } from '../../context/ChartContext';
import type { IndicatorType } from '../../context/ChartContext';

// Simple FX Icon
const FxIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
    </svg>
);

export const IndicatorMenu: React.FC = () => {
    const { indicators, addIndicator, removeIndicator } = useChart();
    const [isOpen, setIsOpen] = useState(false);

    // Config state
    const [selectedType, setSelectedType] = useState<IndicatorType | null>(null);
    const [period, setPeriod] = useState<number>(14);
    const [color, setColor] = useState<string>('#2962FF');

    const availableIndicators: IndicatorType[] = ['SMA', 'EMA', 'RSI', 'MACD'];

    const handleAdd = () => {
        if (selectedType) {
            addIndicator(selectedType, period, color);
            setSelectedType(null);
            setIsOpen(false);
            // Reset defaults
            setPeriod(14);
            setColor('#2962FF');
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                title="Indicators"
            >
                <span className="font-bold text-sm mr-1">fx</span>
                <span className="text-sm">Indicators</span>
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 left-0 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-50 p-4">
                    {!selectedType ? (
                        <>
                            <h3 className="font-bold mb-2 text-sm text-gray-900 dark:text-gray-100">Add Indicator</h3>
                            <div className="flex flex-col space-y-1 mb-4">
                                {availableIndicators.map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            setSelectedType(type);
                                            // Set default color based on type
                                            if (type === 'SMA') setColor('#2962FF');
                                            else if (type === 'EMA') setColor('#FF6D00');
                                            else if (type === 'RSI') setColor('#7B1FA2');
                                            else if (type === 'MACD') setColor('#2962FF');
                                        }}
                                        className="text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300"
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">{selectedType} Settings</h3>
                                <button onClick={() => setSelectedType(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">←</button>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Period</label>
                                <input
                                    type="number"
                                    value={period}
                                    onChange={(e) => setPeriod(Number(e.target.value))}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-transparent text-gray-900 dark:text-gray-100"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Color</label>
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-full h-8 cursor-pointer"
                                />
                            </div>

                            <button
                                onClick={handleAdd}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded py-1 text-sm font-medium"
                            >
                                Add {selectedType}
                            </button>
                        </div>
                    )}

                    {indicators.length > 0 && !selectedType && (
                        <>
                            <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
                            <h3 className="font-bold mb-2 text-sm text-gray-900 dark:text-gray-100">Active</h3>
                            <div className="flex flex-col space-y-1">
                                {indicators.map((ind) => (
                                    <div key={ind.id} className="flex justify-between items-center text-sm px-2 py-1 text-gray-700 dark:text-gray-300">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ind.color }}></div>
                                            <span>{ind.type} ({ind.period})</span>
                                        </div>
                                        <button
                                            onClick={() => removeIndicator(ind.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
