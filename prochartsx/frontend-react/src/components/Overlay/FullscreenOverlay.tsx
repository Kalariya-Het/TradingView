import React from 'react';
import { useChart } from '../../context/ChartContext';

export const FullscreenOverlay: React.FC = () => {
    const { isFullscreen, toggleFullscreen } = useChart();

    if (!isFullscreen) return null;

    return (
        <div className="absolute top-4 right-4 z-50">
            <button
                onClick={toggleFullscreen}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800/90 hover:bg-gray-700/90 text-white rounded-lg shadow-lg transition-all duration-200 backdrop-blur-sm border border-gray-700"
                title="Exit Fullscreen (F)"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
                <span className="text-sm font-medium">Exit Fullscreen</span>
                <span className="text-xs text-gray-400">F</span>
            </button>
        </div>
    );
};
