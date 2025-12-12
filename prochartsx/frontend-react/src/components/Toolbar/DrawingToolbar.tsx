import React from 'react';
import { useChart } from '../../context/ChartContext';
import type { DrawingMode } from '../../context/ChartContext';

// Simple SVG Icons for Drawing Toolbar
const Icons = {
    Cursor: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /><path d="M13 13l6 6" /></svg>,
    Rectangle: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>,
    Path: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19.07 4.93L17 7l-2.83-2.83L17 2.12a2 2 0 0 1 2.83 0l.24.24a2 2 0 0 1 0 2.83zM14.17 9.83l-2.83-2.83L3 15.31V18h2.69l8.31-8.31z" /><path d="M16 22H4a2 2 0 0 1-2-2v-2" /></svg>,
    Fib: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="20" x2="20" y2="4" /><line x1="4" y1="4" x2="20" y2="4" /><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="14" x2="20" y2="14" /><line x1="4" y1="19" x2="20" y2="19" /></svg>,
    Undo: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>,
    Trash: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>,
};

export const DrawingToolbar: React.FC = () => {
    const { drawingMode, setDrawingMode, undoDrawing, clearAllDrawings, drawings } = useChart();

    const tools: { mode: DrawingMode; label: string; icon: React.ReactNode }[] = [
        { mode: 'cursor', label: 'Cursor', icon: <Icons.Cursor /> },
        { mode: 'rectangle', label: 'Rectangle', icon: <Icons.Rectangle /> },
        { mode: 'path', label: 'Trend Line', icon: <Icons.Path /> },
        { mode: 'fibonacci', label: 'Fib Retracement', icon: <Icons.Fib /> },
    ];

    return (
        <div className="flex w-full h-12 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#131722] items-center px-4 space-x-2 z-10">
            {tools.map((tool) => (
                <button
                    key={tool.mode}
                    onClick={() => setDrawingMode(tool.mode)}
                    title={tool.label}
                    className={`p-2 rounded-md transition-colors flex items-center ${drawingMode === tool.mode
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                >
                    {tool.icon}
                    <span className="ml-2 text-sm font-medium hidden sm:block">{tool.label}</span>
                </button>
            ))}

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

            <button
                onClick={undoDrawing}
                title="Undo"
                disabled={drawings.length === 0}
                className={`p-2 rounded-md transition-colors ${drawings.length === 0
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
            >
                <Icons.Undo />
            </button>

            <button
                onClick={clearAllDrawings}
                title="Remove All Drawings"
                disabled={drawings.length === 0}
                className={`p-2 rounded-md transition-colors ${drawings.length === 0
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
            >
                <Icons.Trash />
            </button>
        </div>
    );
};
