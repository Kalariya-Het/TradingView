import React from 'react';
import { ChartSettings, Timeframe } from '../types';

interface ChartControlsProps {
  settings: ChartSettings;
  onSettingsChange: (settings: Partial<ChartSettings>) => void;
  onResetView: () => void;
  onToggleFullscreen: () => void;
}

const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1h' },
  { value: '1D', label: '1D' },
];

const ChartControls: React.FC<ChartControlsProps> = ({
  settings,
  onSettingsChange,
  onResetView,
  onToggleFullscreen,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Timeframe Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="timeframe" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Timeframe:
          </label>
          <select
            id="timeframe"
            value={settings.timeframe}
            onChange={(e) => onSettingsChange({ timeframe: e.target.value as Timeframe })}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Select timeframe"
          >
            {TIMEFRAME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Volume Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="volume"
            checked={settings.showVolume}
            onChange={(e) => onSettingsChange({ showVolume: e.target.checked })}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            aria-label="Show volume chart"
          />
          <label htmlFor="volume" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Volume
          </label>
        </div>

        {/* Scale Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="logscale"
            checked={settings.isLogScale}
            onChange={(e) => onSettingsChange({ isLogScale: e.target.checked })}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            aria-label="Use logarithmic scale"
          />
          <label htmlFor="logscale" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Log Scale
          </label>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSettingsChange({ theme: settings.theme === 'light' ? 'dark' : 'light' })}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label={`Switch to ${settings.theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {settings.theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onResetView}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Reset chart view"
            title="Reset View (R)"
          >
            🔄 Reset
          </button>
          <button
            onClick={onToggleFullscreen}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Toggle fullscreen"
            title="Fullscreen (F)"
          >
            ⛶ Fullscreen
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Keyboard shortcuts: R (Reset), F (Fullscreen), Mouse wheel (Zoom), Drag (Pan)
      </div>
    </div>
  );
};

export default ChartControls;