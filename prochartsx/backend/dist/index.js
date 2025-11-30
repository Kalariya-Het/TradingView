"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const multer_1 = __importDefault(require("multer"));
const papaparse_1 = __importDefault(require("papaparse"));
const Candle_1 = require("./models/Candle");
const ChartState_1 = require("./models/ChartState");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/prochartsx';
mongoose_1.default
    .connect(mongoUri)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));
// Multer setup for CSV upload (store in memory)
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Helper to validate CSV columns
const requiredColumns = ['timestamp', 'open', 'high', 'low', 'close', 'volume'];
app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const csvString = req.file.buffer.toString('utf-8');
    const parseResult = papaparse_1.default.parse(csvString, { header: true, skipEmptyLines: true });
    if (parseResult.errors.length) {
        return res.status(400).json({ error: 'CSV parsing error', details: parseResult.errors });
    }
    const data = parseResult.data;
    // Validate columns
    const missing = requiredColumns.filter((col) => !(col in data[0]));
    if (missing.length) {
        return res.status(400).json({ error: 'Missing columns', missing });
    }
    // Transform rows
    const candles = data.map((row) => {
        // Flexible timestamp parsing
        let ts = new Date(row.timestamp);
        if (isNaN(ts.getTime())) {
            // try Unix ms
            const num = Number(row.timestamp);
            if (!isNaN(num))
                ts = new Date(num);
        }
        return new Candle_1.Candle({
            timestamp: ts,
            open: Number(row.open),
            high: Number(row.high),
            low: Number(row.low),
            close: Number(row.close),
            volume: Number(row.volume),
        });
    });
    try {
        await Candle_1.Candle.insertMany(candles);
        res.json({ message: 'CSV data saved', count: candles.length });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database insert error' });
    }
});
// Simple endpoint to fetch candles (optionally with query params)
app.get('/api/candles', async (req, res) => {
    const { start, end } = req.query;
    const filter = {};
    if (start)
        filter.timestamp = { $gte: new Date(start) };
    if (end) {
        filter.timestamp = filter.timestamp || {};
        filter.timestamp.$lte = new Date(end);
    }
    const candles = await Candle_1.Candle.find(filter).sort({ timestamp: 1 }).lean();
    res.json(candles);
});
// Chart State Endpoints
app.get('/api/chart-state', async (req, res) => {
    try {
        const state = await ChartState_1.ChartState.findOne({ userId: 'default-user' });
        res.json(state || { drawings: [], indicators: [] });
    }
    catch (error) {
        res.status(500).send(error);
    }
});
app.post('/api/chart-state', async (req, res) => {
    try {
        const { drawings, indicators } = req.body;
        const state = await ChartState_1.ChartState.findOneAndUpdate({ userId: 'default-user' }, { drawings, indicators, lastUpdated: new Date() }, { upsert: true, new: true });
        res.json(state);
    }
    catch (error) {
        res.status(500).send(error);
    }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
