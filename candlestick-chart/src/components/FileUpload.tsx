import React, { useCallback, useState } from 'react';
import { parseCSV, ParsedCSVData } from '../utils/csvParser';

interface FileUploadProps {
  onDataParsed: (data: ParsedCSVData) => void;
  onError: (error: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataParsed, onError }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      onError('Please select a CSV file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      onError('File size too large. Maximum 100MB allowed.');
      return;
    }

    setIsProcessing(true);
    try {
      const text = await file.text();
      const result = parseCSV(text);

      if (result.errors.length > 0) {
        onError(result.errors.join('\n'));
      } else if (result.data.length === 0) {
        onError('No valid data found in CSV file');
      } else {
        onDataParsed(result);
      }
    } catch (error) {
      onError(`Error reading file: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  }, [onDataParsed, onError]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const downloadSampleCSV = useCallback(() => {
    const sampleData = `timestamp,open,high,low,close,volume
2024-01-01T09:30:00Z,100.0,105.0,95.0,102.0,1000
2024-01-01T10:00:00Z,102.0,108.0,100.0,106.0,1200
2024-01-01T10:30:00Z,106.0,110.0,103.0,108.0,800
2024-01-01T11:00:00Z,108.0,112.0,105.0,110.0,1500
2024-01-01T11:30:00Z,110.0,115.0,107.0,113.0,1100`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-ohlcv-data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Processing CSV file...</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="mb-4">
              <p className="text-lg font-medium text-gray-900 mb-2">
                Upload OHLCV CSV File
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop your CSV file here, or click to browse
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">
                <span>Browse Files</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="Select CSV file"
                />
              </label>
              <button
                onClick={downloadSampleCSV}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                aria-label="Download sample CSV file"
              >
                Download Sample CSV
              </button>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <p>Supported formats: ISO 8601 timestamps (e.g., "2019-05-02 00:00:00+00:00" or "2024-01-01T09:30:00Z") or Unix milliseconds</p>
              <p>Required columns: timestamp, open, high, low, close (volume optional)</p>
              <p>Maximum file size: 100MB</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;