interface Candle {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

/**
 * Convert timeframe string to milliseconds
 */
export function getTimeframeMilliseconds(timeframe: string): number {
    const match = timeframe.match(/^(\d+)([mhdw])$/i);
    if (!match) return 3600000; // Default to 1h

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
        case 'm': return value * 60 * 1000;           // minutes
        case 'h': return value * 60 * 60 * 1000;      // hours
        case 'd': return value * 24 * 60 * 60 * 1000; // days
        case 'w': return value * 7 * 24 * 60 * 60 * 1000; // weeks
        default: return 3600000; // Default to 1h
    }
}

/**
 * Aggregate candles to a target timeframe
 */
export function aggregateCandles(candles: Candle[], timeframe: string): Candle[] {
    if (!candles || candles.length === 0) return [];

    const intervalMs = getTimeframeMilliseconds(timeframe);
    const aggregated: Candle[] = [];

    // Sort candles by timestamp
    const sorted = [...candles].sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let currentBucket: Candle[] = [];
    let bucketStartTime = 0;

    sorted.forEach((candle) => {
        const candleTime = new Date(candle.timestamp).getTime();

        // Determine which bucket this candle belongs to
        const candleBucketStart = Math.floor(candleTime / intervalMs) * intervalMs;

        if (bucketStartTime === 0) {
            bucketStartTime = candleBucketStart;
        }

        // If this candle is in a new bucket, aggregate the previous bucket
        if (candleBucketStart !== bucketStartTime) {
            if (currentBucket.length > 0) {
                aggregated.push(aggregateBucket(currentBucket, bucketStartTime));
            }
            currentBucket = [];
            bucketStartTime = candleBucketStart;
        }

        currentBucket.push(candle);
    });

    // Don't forget the last bucket
    if (currentBucket.length > 0) {
        aggregated.push(aggregateBucket(currentBucket, bucketStartTime));
    }

    return aggregated;
}

/**
 * Aggregate a bucket of candles into a single candle
 */
function aggregateBucket(bucket: Candle[], bucketStartTime: number): Candle {
    const open = bucket[0].open;
    const close = bucket[bucket.length - 1].close;
    const high = Math.max(...bucket.map(c => c.high));
    const low = Math.min(...bucket.map(c => c.low));
    const volume = bucket.reduce((sum, c) => sum + c.volume, 0);

    return {
        timestamp: new Date(bucketStartTime).toISOString(),
        open,
        high,
        low,
        close,
        volume
    };
}
