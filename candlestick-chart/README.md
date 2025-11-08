# Candlestick Chart Viewer

A production-ready single-page web application for viewing interactive candlestick charts from OHLCV CSV data. Built with React, TypeScript, and Lightweight Charts.

## Features

- **CSV Upload**: Drag-and-drop or browse CSV files with automatic format detection
- **Interactive Charts**: Pan, zoom, and crosshair with OHLCV tooltips
- **Timeframe Aggregation**: Auto-detect or manually set timeframes (1m, 5m, 15m, 1h, 1D)
- **Volume Charts**: Toggle volume histogram below price chart
- **Scale Options**: Linear or logarithmic price scales
- **Themes**: Light and dark mode support
- **Performance**: Handles >100k data points with downsampling
- **Responsive**: Mobile-friendly design
- **Accessibility**: Keyboard navigation and screen reader support

## CSV Format

The app accepts CSV files with the following columns (case-insensitive):

### Required Columns
- `timestamp` or `time` or `date` or `datetime` - ISO 8601 format (`2024-01-01T09:30:00Z`) or Unix milliseconds
- `open` or `o` - Opening price
- `high` or `h` - High price
- `low` or `l` - Low price
- `close` or `c` - Closing price

### Optional Columns
- `volume` or `vol` or `v` - Trading volume

### Example CSV
```csv
timestamp,open,high,low,close,volume
2024-01-01T09:30:00Z,100.0,105.0,95.0,102.0,1000
2024-01-01T10:00:00Z,102.0,108.0,100.0,106.0,1200
2024-01-01T10:30:00Z,106.0,110.0,103.0,108.0,800
```

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm

### Install Dependencies
```bash
npm install
```

### Development
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production
```bash
npm run build
npm run preview
```

### Run Tests
```bash
npm test
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Architecture

### Components
- `App` - Main application component
- `FileUpload` - CSV file upload with drag-and-drop
- `CandlestickChart` - Chart rendering using Lightweight Charts
- `ChartControls` - Settings panel for chart customization
- `ChartTooltip` - Crosshair tooltip component

### Utils
- `csvParser` - CSV parsing with format auto-detection
- `dataAggregation` - Timeframe aggregation logic
- `downsampling` - LTTB algorithm for performance optimization

### Technologies
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Charts**: Lightweight Charts (free, no license required)
- **CSV Parsing**: PapaParse
- **Build Tool**: Vite
- **Testing**: Vitest, React Testing Library

## Performance Optimizations

- **Downsampling**: Uses Largest Triangle Three Bucket (LTTB) algorithm to reduce data points for smooth rendering
- **Virtualization**: Only renders visible chart elements
- **Streaming**: CSV parsing supports large files without blocking UI
- **Memoization**: React components use proper memoization for efficient re-renders

## Accessibility

- Keyboard navigation for all interactive elements
- Screen reader support with proper ARIA labels
- High contrast themes
- Focus management
- Semantic HTML structure

## Demo

1. Download the sample CSV file using the "Download Sample CSV" button
2. Upload it via drag-and-drop or file browser
3. Explore the interactive chart features:
   - Zoom with mouse wheel
   - Pan by dragging
   - Use timeframe selector for different aggregations
   - Toggle volume chart visibility
   - Switch between light/dark themes
   - Use keyboard shortcuts (R for reset, F for fullscreen)

## API Reference

### Chart Settings
```typescript
interface ChartSettings {
  timeframe: 'auto' | '1m' | '5m' | '15m' | '1h' | '1D';
  showVolume: boolean;
  isLogScale: boolean;
  theme: 'light' | 'dark';
}
```

### Data Format
```typescript
interface OHLCVData {
  timestamp: number; // Unix timestamp in milliseconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.