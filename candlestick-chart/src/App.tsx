import { useState, useCallback, useRef, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import CandlestickChart from './components/CandlestickChart';
import ChartControls from './components/ChartControls';
// import ChartTooltip from './components/ChartTooltip';
import { OHLCVData, ChartSettings, ParsedCSVData } from './types';

function App() {
  const [data, setData] = useState<OHLCVData[]>([]);
  const [settings, setSettings] = useState<ChartSettings>({
    timeframe: 'auto',
    showVolume: true,
    isLogScale: false,
    theme: 'light',
  });
  const [error, setError] = useState<string>('');
  // const [tooltipState, setTooltipState] = useState({
  //   visible: false,
  //   position: { x: 0, y: 0 },
  //   time: null as number | null,
  // });

  const chartRef = useRef<any>(null);
  const [chartWidth, setChartWidth] = useState(window.innerWidth - 64);

  const handleDataParsed = useCallback((parsedData: ParsedCSVData) => {
    setData(parsedData.data);
    setError('');
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setData([]);
  }, []);

  const handleSettingsChange = useCallback((newSettings: Partial<ChartSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const handleResetView = useCallback(() => {
    if (chartRef.current?.resetView) {
      chartRef.current.resetView();
    }
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (chartRef.current?.toggleFullscreen) {
      chartRef.current.toggleFullscreen();
    }
  }, []);

  // const handleCrosshairMove = useCallback((param: any) => {
  //   if (param.time) {
  //     setTooltipState({
  //       visible: true,
  //       position: { x: param.point.x, y: param.point.y },
  //       time: param.time,
  //     });
  //   } else {
  //     setTooltipState(prev => ({ ...prev, visible: false }));
  //   }
  // }, []);

  // Apply theme to document
  useState(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });

  // Handle window resize for responsive chart width
  useEffect(() => {
    const handleResize = () => {
      setChartWidth(window.innerWidth - 64);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`min-h-screen ${settings.theme === 'dark' ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Candlestick Chart Viewer</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload a CSV file with OHLCV data to view an interactive candlestick chart
          </p>
        </header>

        {data.length === 0 ? (
          <div className="max-w-4xl mx-auto">
            <FileUpload onDataParsed={handleDataParsed} onError={handleError} />
            {error && (
              <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <ChartControls
              settings={settings}
              onSettingsChange={handleSettingsChange}
              onResetView={handleResetView}
              onToggleFullscreen={handleToggleFullscreen}
            />

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="relative">
                <CandlestickChart
                  data={data}
                  settings={settings}
                  width={chartWidth}
                  height={600}
                />
                {/* <ChartTooltip
                  data={data}
                  visible={tooltipState.visible}
                  position={tooltipState.position}
                  time={tooltipState.time}
                /> */}
              </div>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setData([]);
                  setError('');
                }}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
              >
                Upload New File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;