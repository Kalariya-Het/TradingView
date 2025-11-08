export interface OHLCVData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface ParsedCSVData {
  data: OHLCVData[];
  headers: string[];
  errors: string[];
}

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '1D' | 'auto';

export interface ChartSettings {
  timeframe: Timeframe;
  showVolume: boolean;
  isLogScale: boolean;
  theme: 'light' | 'dark';
}