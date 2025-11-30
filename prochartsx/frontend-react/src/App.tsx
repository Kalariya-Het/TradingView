import React from 'react';
import './App.css';
import { ChartContainer } from './components/Chart/ChartContainer';
import { TopToolbar } from './components/Toolbar/TopToolbar';
import { DrawingToolbar } from './components/Toolbar/DrawingToolbar';
import { ChartProvider } from './context/ChartContext';

const App: React.FC = () => {
  return (
    <ChartProvider>
      <div className="flex flex-col h-screen w-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
        {/* Top toolbar */}
        <TopToolbar />
        <DrawingToolbar />

        {/* Main Chart Area */}
        <main className="flex-1 relative bg-white dark:bg-black overflow-hidden">
          <ChartContainer />
        </main>
      </div>
    </ChartProvider>
  );
};

export default App;
