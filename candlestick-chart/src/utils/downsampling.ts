import { OHLCVData } from '../types';

// Largest Triangle Three Bucket (LTTB) algorithm for downsampling
export function downsampleLTTB(data: OHLCVData[], targetPoints: number): OHLCVData[] {
  if (data.length <= targetPoints) {
    return data;
  }

  const sampled: OHLCVData[] = [];
  const bucketSize = (data.length - 2) / (targetPoints - 2);

  // Always include first point
  sampled.push(data[0]);

  for (let i = 1; i < targetPoints - 1; i++) {
    const bucketStart = Math.floor((i - 1) * bucketSize) + 1;
    const bucketEnd = Math.floor(i * bucketSize) + 1;
    const bucketData = data.slice(bucketStart, bucketEnd + 1);

    if (bucketData.length > 0) {
      const selectedPoint = findLargestTriangle(bucketData, data[bucketStart - 1], data[bucketEnd + 1]);
      sampled.push(selectedPoint);
    }
  }

  // Always include last point
  sampled.push(data[data.length - 1]);

  return sampled;
}

function findLargestTriangle(bucket: OHLCVData[], prevPoint: OHLCVData, nextPoint: OHLCVData): OHLCVData {
  let maxArea = -1;
  let selectedPoint = bucket[0];

  for (const point of bucket) {
    const area = calculateTriangleArea(prevPoint, point, nextPoint);
    if (area > maxArea) {
      maxArea = area;
      selectedPoint = point;
    }
  }

  return selectedPoint;
}

function calculateTriangleArea(p1: OHLCVData, p2: OHLCVData, p3: OHLCVData): number {
  // Use average of OHLC as Y coordinate for area calculation
  const y1 = (p1.open + p1.high + p1.low + p1.close) / 4;
  const y2 = (p2.open + p2.high + p2.low + p2.close) / 4;
  const y3 = (p3.open + p3.high + p3.low + p3.close) / 4;

  // Use timestamp as X coordinate
  const x1 = p1.timestamp;
  const x2 = p2.timestamp;
  const x3 = p3.timestamp;

  // Calculate area using cross product
  return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2);
}

// Simple downsampling by taking every nth point
export function downsampleSimple(data: OHLCVData[], targetPoints: number): OHLCVData[] {
  if (data.length <= targetPoints) {
    return data;
  }

  const step = Math.floor(data.length / targetPoints);
  const sampled: OHLCVData[] = [];

  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i]);
  }

  // Ensure we include the last point
  if (sampled[sampled.length - 1] !== data[data.length - 1]) {
    sampled.push(data[data.length - 1]);
  }

  return sampled;
}

// Adaptive downsampling based on data density and screen resolution
export function downsampleAdaptive(data: OHLCVData[], maxPoints: number): OHLCVData[] {
  if (data.length <= maxPoints) {
    return data;
  }

  // For very large datasets, use LTTB for better quality
  if (data.length > 10000) {
    return downsampleLTTB(data, maxPoints);
  }

  // For moderate datasets, use simple downsampling for speed
  return downsampleSimple(data, maxPoints);
}