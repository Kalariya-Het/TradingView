import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import multer from 'multer';
import Papa from 'papaparse';
import { Candle } from './models/Candle';
import { ChartState } from './models/ChartState';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/prochartsx';
mongoose
    .connect(mongoUri)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Multer setup for CSV upload (store in memory)
const upload = multer({ storage: multer.memoryStorage() });

// Helper to validate CSV columns
const requiredColumns = ['timestamp', 'open', 'high', 'low', 'close', 'volume'];

app.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const csvString = req.file.buffer.toString('utf-8');
    const parseResult = Papa.parse(csvString, { header: true, skipEmptyLines: true });
    if (parseResult.errors.length) {
        return res.status(400).json({ error: 'CSV parsing error', details: parseResult.errors });
    }
    const data = parseResult.data as any[];
    // Validate columns
    const missing = requiredColumns.filter((col) => !(col in data[0]));
    if (missing.length) {
        return res.status(400).json({ error: 'Missing columns', missing });
    }
    // Transform rows
    // Transform rows and filter invalid ones
    const candles = data.map((row) => {
        // Flexible timestamp parsing
        let ts = new Date(row.timestamp);
        if (isNaN(ts.getTime())) {
            // try Unix ms
            const num = Number(row.timestamp);
            if (!isNaN(num)) ts = new Date(num);
        }

        // Basic validation
        if (isNaN(ts.getTime())) return null;

        return {
            timestamp: ts,
            open: Number(row.open),
            high: Number(row.high),
            low: Number(row.low),
            close: Number(row.close),
            volume: Number(row.volume),
        };
    }).filter(c => c !== null);

    if (candles.length === 0) {
        return res.status(400).json({ error: 'No valid data found in CSV' });
    }

    try {
        await Candle.deleteMany({}); // Clear old data
        console.log('Old data cleared');
        await Candle.insertMany(candles);
        res.json({ message: 'CSV data saved', count: candles.length });
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: e.message || 'Database insert error' });
    }
});

// Simple endpoint to fetch candles (optionally with query params)
app.get('/api/candles', async (req: Request, res: Response) => {
    const { start, end } = req.query;
    const filter: any = {};
    if (start) filter.timestamp = { $gte: new Date(start as string) };
    if (end) {
        filter.timestamp = filter.timestamp || {};
        filter.timestamp.$lte = new Date(end as string);
    }
    const candles = await Candle.find(filter).sort({ timestamp: 1 }).lean();
    res.json(candles);
});

// Chart State Endpoints
app.get('/api/chart-state', async (req, res) => {
    try {
        const state = await ChartState.findOne({ userId: 'default-user' });
        res.json(state || { drawings: [], indicators: [] });
    } catch (error) {
        res.status(500).send(error);
    }
});

app.post('/api/chart-state', async (req, res) => {
    try {
        const { drawings, indicators } = req.body;
        const state = await ChartState.findOneAndUpdate(
            { userId: 'default-user' },
            { drawings, indicators, lastUpdated: new Date() },
            { upsert: true, new: true }
        );
        res.json(state);
    } catch (error) {
        res.status(500).send(error);
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
