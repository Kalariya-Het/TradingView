import { describe, it, expect } from 'vitest';
import { parseCSV } from './csvParser';

describe('CSV Parser', () => {
  it('should parse valid ISO 8601 timestamp CSV', () => {
    const csv = `timestamp,open,high,low,close,volume
2024-01-01T09:30:00Z,100.0,105.0,95.0,102.0,1000
2024-01-01T10:00:00Z,102.0,108.0,100.0,106.0,1200`;

    const result = parseCSV(csv);

    expect(result.errors).toHaveLength(0);
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toEqual({
      timestamp: 1704103800000, // 2024-01-01T09:30:00Z
      open: 100.0,
      high: 105.0,
      low: 95.0,
      close: 102.0,
      volume: 1000,
    });
  });

  it('should parse valid Unix timestamp CSV', () => {
    const csv = `time,open,high,low,close,vol
1704103800000,100.0,105.0,95.0,102.0,1000
1704107400000,102.0,108.0,100.0,106.0,1200`;

    const result = parseCSV(csv);

    expect(result.errors).toHaveLength(0);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].timestamp).toBe(1704103800000);
  });

  it('should handle missing volume column', () => {
    const csv = `timestamp,open,high,low,close
2024-01-01T09:30:00Z,100.0,105.0,95.0,102.0`;

    const result = parseCSV(csv);

    expect(result.errors).toHaveLength(0);
    expect(result.data[0].volume).toBeUndefined();
  });

  it('should detect missing required columns', () => {
    const csv = `timestamp,open,high,low
2024-01-01T09:30:00Z,100.0,105.0,95.0`;

    const result = parseCSV(csv);

    expect(result.errors).toContain('Missing required columns: close');
    expect(result.data).toHaveLength(0);
  });

  it('should handle invalid data gracefully', () => {
    const csv = `timestamp,open,high,low,close
2024-01-01T09:30:00Z,invalid,105.0,95.0,102.0`;

    const result = parseCSV(csv);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Invalid data');
  });

  it('should sort data by timestamp', () => {
    const csv = `timestamp,open,high,low,close
2024-01-01T10:00:00Z,102.0,108.0,100.0,106.0
2024-01-01T09:30:00Z,100.0,105.0,95.0,102.0`;

    const result = parseCSV(csv);

    expect(result.data[0].timestamp).toBeLessThan(result.data[1].timestamp);
  });
});