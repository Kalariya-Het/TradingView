import { OHLCVData, Timeframe } from '../types';

const TIMEFRAME_INTERVALS: Record<Timeframe, number> = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '1D': 24 * 60 * 60 * 1000,
  'auto': 0, // Will be calculated based on data
};

function getBucketTimestamp(timestamp: number, interval: number): number {
  return Math.floor(timestamp / interval) * interval;
}

function aggregateOHLCV(data: OHLCVData[]): OHLCVData {
  if (data.length === 0) {
    throw new Error('Cannot aggregate empty data');
  }

  const first = data[0];
  const last = data[data.length - 1];

  return {
    timestamp: first.timestamp,
    open: first.open,
    high: Math.max(...data.map(d => d.high)),
    low: Math.min(...data.map(d => d.low)),
    close: last.close,
    volume: data.reduce((sum, d) => sum + (d.volume || 0), 0),
  };
}

export function aggregateData(data: OHLCVData[], timeframe: Timeframe): OHLCVData[] {
  if (timeframe === 'auto' || data.length === 0) {
    return data;
  }

  const interval = TIMEFRAME_INTERVALS[timeframe];
  const buckets = new Map<number, OHLCVData[]>();

  // Group data by time buckets
  for (const item of data) {
    const bucketKey = getBucketTimestamp(item.timestamp, interval);
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, []);
    }
    buckets.get(bucketKey)!.push(item);
  }

  // Aggregate each bucket
  const aggregated: OHLCVData[] = [];
  for (const [, bucketData] of buckets) {
    aggregated.push(aggregateOHLCV(bucketData));
  }

  // Sort by timestamp
  aggregated.sort((a, b) => a.timestamp - b.timestamp);

  return aggregated;
}

export function calculateAutoTimeframe(data: OHLCVData[]): Timeframe {
  if (data.length < 2) return '1m';

  const timeDiffs = [];
  for (let i = 1; i < data.length; i++) {
    timeDiffs.push(data[i].timestamp - data[i - 1].timestamp);
  }

  const avgInterval = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;

  // Find the closest standard timeframe
  const intervals = Object.entries(TIMEFRAME_INTERVALS).filter(([k]) => k !== 'auto') as [Timeframe, number][];

  let closest: Timeframe = '1m';
  let minDiff = Infinity;

  for (const [timeframe, interval] of intervals) {
    const diff = Math.abs(interval - avgInterval);
    if (diff < minDiff) {
      minDiff = diff;
      closest = timeframe;
    }
  }

  return closest;
}