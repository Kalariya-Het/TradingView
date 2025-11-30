import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useChart } from '../../context/ChartContext';
import { CSVUploader } from '../Upload/CSVUploader';
import { IndicatorMenu } from '../Indicators/IndicatorMenu';

// Simple SVG Icons
const Icons = {
    ZoomIn: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>,
    ZoomOut: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>,
    Camera: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>,
    Sun: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>,
    Moon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
    Save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>,
    Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
};

export const TopToolbar: React.FC = () => {
    const [timeframe, setTimeframe] = useState('1h');
    const [chartType, setChartType] = useState('Candles');
    const { zoomIn, zoomOut, screenshot, refreshData, drawings, indicators, loadState } = useChart();
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('theme');
        if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            setIsDark(true);
        } else {
            document.documentElement.classList.remove('dark');
            setIsDark(false);
        }
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };

    const btnClass = "flex items-center justify-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors";
    const selectClass = "bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1";

    return (
        <div className="flex items-center w-full h-12 px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#131722]">
            {/* Logo */}
            <div className="flex items-center mr-6">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" /></svg>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">ProChartsX</span>
            </div>

            {/* Left Group: Symbol Info (Placeholder) & Timeframe */}
            <div className="flex items-center space-x-2 mr-4 border-r border-gray-200 dark:border-gray-700 pr-4">
                <div className="font-bold text-lg text-gray-900 dark:text-white mr-2">BTCUSD</div>
                <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className={selectClass}
                >
                    <option value="1m">1m</option>
                    <option value="5m">5m</option>
                    <option value="15m">15m</option>
                    <option value="1h">1h</option>
                    <option value="4h">4h</option>
                    <option value="1d">1d</option>
                    <option value="1w">1w</option>
                </select>

                <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value)}
                    className={selectClass}
                >
                    <option value="Candles">Candles</option>
                    <option value="Bars">Bars</option>
                    <option value="Line">Line</option>
                    <option value="Heikin-Ashi">Heikin-Ashi</option>
                </select>
            </div>

            {/* Center Group: Tools & Indicators */}
            <div className="flex items-center space-x-1 flex-1">
                <IndicatorMenu />

                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

                <button onClick={zoomIn} className={btnClass} title="Zoom In">
                    <Icons.ZoomIn />
                </button>
                <button onClick={zoomOut} className={btnClass} title="Zoom Out">
                    <Icons.ZoomOut />
                </button>
                <button onClick={screenshot} className={btnClass} title="Screenshot">
                    <Icons.Camera />
                </button>
            </div>

            {/* Right Group: System & Data */}
            <div className="flex items-center space-x-2 ml-auto pl-4 border-l border-gray-200 dark:border-gray-700">
                <CSVUploader onUploadSuccess={refreshData} />

                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

                <button
                    onClick={async () => {
                        try {
                            await axios.post('http://localhost:5000/api/chart-state', {
                                drawings,
                                indicators
                            });
                            alert('Layout saved successfully');
                        } catch (e) {
                            alert('Error saving layout');
                        }
                    }}
                    className={btnClass}
                    title="Save Layout"
                >
                    <Icons.Save />
                </button>

                <button
                    onClick={async () => {
                        try {
                            const res = await axios.get('http://localhost:5000/api/chart-state');
                            loadState(res.data.drawings, res.data.indicators);
                            alert('Layout loaded successfully');
                        } catch (e) {
                            alert('Error loading layout');
                        }
                    }}
                    className={btnClass}
                    title="Load Layout"
                >
                    <Icons.Download />
                </button>

                <button onClick={toggleTheme} className={btnClass} title="Toggle Theme">
                    {isDark ? <Icons.Sun /> : <Icons.Moon />}
                </button>
            </div>
        </div>
    );
};
