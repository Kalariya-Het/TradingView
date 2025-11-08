import React, { useEffect, useState } from 'react';
import { OHLCVData } from '../types';

interface ChartTooltipProps {
  data: OHLCVData[];
  visible: boolean;
  position: { x: number; y: number };
  time: number | null;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({ data, visible, position, time }) => {
  const [tooltipData, setTooltipData] = useState<OHLCVData | null>(null);

  useEffect(() => {
    if (!time || !data.length) {
      setTooltipData(null);
      return;
    }

    // Find the closest data point to the hovered time
    const timeMs = time * 1000; // Convert back to milliseconds
    let closest = data[0];
    let minDiff = Math.abs(data[0].timestamp - timeMs);

    for (const item of data) {
      const diff = Math.abs(item.timestamp - timeMs);
      if (diff < minDiff) {
        minDiff = diff;
        closest = item;
      }
    }

    setTooltipData(closest);
  }, [time, data]);

  if (!visible || !tooltipData) {
    return null;
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  const formatVolume = (volume?: number) => {
    if (!volume) return 'N/A';
    return volume.toLocaleString();
  };

  return (
    <div
      className="fixed z-50 bg-black text-white px-3 py-2 rounded shadow-lg pointer-events-none text-sm"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: position.x > window.innerWidth / 2 ? 'translateX(-100%)' : 'none',
      }}
    >
      <div className="font-semibold mb-1">
        {formatTime(tooltipData.timestamp)}
      </div>
      <div className="space-y-1">
        <div>Open: <span className="font-mono">{formatPrice(tooltipData.open)}</span></div>
        <div>High: <span className="font-mono text-green-400">{formatPrice(tooltipData.high)}</span></div>
        <div>Low: <span className="font-mono text-red-400">{formatPrice(tooltipData.low)}</span></div>
        <div>Close: <span className="font-mono">{formatPrice(tooltipData.close)}</span></div>
        {tooltipData.volume && (
          <div>Volume: <span className="font-mono">{formatVolume(tooltipData.volume)}</span></div>
        )}
      </div>
    </div>
  );
};

export default ChartTooltip;