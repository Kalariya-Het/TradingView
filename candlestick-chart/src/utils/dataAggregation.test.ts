import { describe, it, expect } from 'vitest';
import { aggregateData, calculateAutoTimeframe } from './dataAggregation';
import { OHLCVData } from '../types';

const mockData: OHLCVData[] = [
  {
    timestamp: 1704103800000, // 2024-01-01T09:30:00Z
    open: 100,
    high: 105,
    low: 95,
    close: 102,
    volume: 1000,
  },
  {
    timestamp: 1704105600000, // 2024-01-01T10:00:00Z (30 min later)
    open: 102,
    high: 108,
    low: 100,
    close: 106,
    volume: 1200,
  },
  {
    timestamp: 1704107400000, // 2024-01-01T10:30:00Z (1 hour total)
    open: 106,
    high: 110,
    low: 103,
    close: 108,
    volume: 800,
  },
];

describe('Data Aggregation', () => {
  it('should not aggregate when timeframe is auto', () => {
    const result = aggregateData(mockData, 'auto');
    expect(result).toEqual(mockData);
  });

  it('should aggregate to 1 hour timeframe', () => {
    const result = aggregateData(mockData, '1h');

    // Should combine first two 30-min bars into one 1-hour bar
    expect(result).toHaveLength(2);

    const firstHour = result[0];
    expect(firstHour.open).toBe(100); // First open
    expect(firstHour.high).toBe(108); // Max of both highs
    expect(firstHour.low).toBe(95); // Min of both lows
    expect(firstHour.close).toBe(106); // Last close
    expect(firstHour.volume).toBe(2200); // Sum of volumes
  });

  it('should calculate auto timeframe correctly', () => {
    const result = calculateAutoTimeframe(mockData);
    // Average interval is ~30 minutes, so should return '1h' or similar
    expect(['1h', '5m', '15m']).toContain(result);
  });

  it('should handle empty data', () => {
    const result = aggregateData([], '1h');
    expect(result).toHaveLength(0);
  });

  it('should handle single data point', () => {
    const singleData = [mockData[0]];
    const result = calculateAutoTimeframe(singleData);
    expect(result).toBe('1m'); // Default for insufficient data
  });
});