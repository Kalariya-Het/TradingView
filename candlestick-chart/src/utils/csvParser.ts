import Papa from 'papaparse';
import { OHLCVData } from '../types';

// const REQUIRED_HEADERS = ['timestamp', 'open', 'high', 'low', 'close'];
// const OPTIONAL_HEADERS = ['volume'];

function detectTimestampFormat(value: string): 'iso' | 'unix' | null {
  // Try to parse as Unix timestamp
  const num = parseInt(value);
  if (!isNaN(num) && /^\d{10,13}$/.test(value)) {
    return 'unix';
  }
  // Try to parse as ISO 8601 (with T or space separator)
  const date = new Date(value);
  if (!isNaN(date.getTime()) && (value.includes('T') || value.includes(' '))) {
    return 'iso';
  }
  return null;
}

function parseTimestamp(value: string, format: 'iso' | 'unix'): number {
  if (format === 'iso') {
    return new Date(value).getTime();
  } else {
    const num = parseInt(value);
    // If it's 10 digits, assume seconds, convert to milliseconds
    return num < 1e10 ? num * 1000 : num;
  }
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim();
}

function findColumnIndex(headers: string[], possibleNames: string[]): number | null {
  const normalizedHeaders = headers.map(normalizeHeader);
  for (const name of possibleNames) {
    const index = normalizedHeaders.indexOf(name.toLowerCase());
    if (index !== -1) return index;
  }
  return null;
}

export interface ParsedCSVData {
  data: OHLCVData[];
  headers: string[];
  errors: string[];
}

export function parseCSV(csvText: string): ParsedCSVData {
  const errors: string[] = [];
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  if (result.errors.length > 0) {
    errors.push(...result.errors.map(e => e.message));
  }

  const headers = result.meta.fields || [];
  if (headers.length === 0) {
    errors.push('No headers found in CSV');
    return { data: [], headers: [], errors };
  }

  // Find column indices
  const timestampIndex = findColumnIndex(headers, ['timestamp', 'time', 'date', 'datetime']);
  const openIndex = findColumnIndex(headers, ['open', 'o']);
  const highIndex = findColumnIndex(headers, ['high', 'h']);
  const lowIndex = findColumnIndex(headers, ['low', 'l']);
  const closeIndex = findColumnIndex(headers, ['close', 'c']);
  const volumeIndex = findColumnIndex(headers, ['volume', 'vol', 'v']);

  // Check required columns
  const missingRequired = [];
  if (timestampIndex === null) missingRequired.push('timestamp');
  if (openIndex === null) missingRequired.push('open');
  if (highIndex === null) missingRequired.push('high');
  if (lowIndex === null) missingRequired.push('low');
  if (closeIndex === null) missingRequired.push('close');

  if (missingRequired.length > 0) {
    errors.push(`Missing required columns: ${missingRequired.join(', ')}`);
    return { data: [], headers, errors };
  }

  // Detect timestamp format from first few rows
  let timestampFormat: 'iso' | 'unix' | null = null;
  for (let i = 0; i < Math.min(result.data.length, 5); i++) {
    const row = result.data[i] as any;
    const timestampValue = row[headers[timestampIndex!]];
    if (timestampValue != null) {
      timestampFormat = detectTimestampFormat(String(timestampValue));
      if (timestampFormat) break;
    }
  }

  if (!timestampFormat) {
    errors.push('Could not detect timestamp format. Expected ISO 8601 or Unix timestamp');
    return { data: [], headers, errors };
  }

  // Parse data
  const data: OHLCVData[] = [];
  for (const row of result.data as any[]) {
    try {
      const timestamp = parseTimestamp(String(row[headers[timestampIndex!]]), timestampFormat);
      const open = parseFloat(row[headers[openIndex!]]);
      const high = parseFloat(row[headers[highIndex!]]);
      const low = parseFloat(row[headers[lowIndex!]]);
      const close = parseFloat(row[headers[closeIndex!]]);
      const volume = volumeIndex !== null ? parseFloat(row[headers[volumeIndex]]) : undefined;

      if (isNaN(timestamp) || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
        errors.push(`Invalid data in row: ${JSON.stringify(row)}`);
        continue;
      }

      data.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume: volume && !isNaN(volume) ? volume : undefined,
      });
    } catch (e) {
      errors.push(`Error parsing row: ${JSON.stringify(row)} - ${e}`);
    }
  }

  // Sort by timestamp
  data.sort((a, b) => a.timestamp - b.timestamp);

  return { data, headers, errors };
}