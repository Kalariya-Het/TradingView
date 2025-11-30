import mongoose from 'mongoose';

const ChartStateSchema = new mongoose.Schema({
    userId: { type: String, required: true, default: 'default-user' }, // Simple user ID for now
    drawings: { type: Array, default: [] },
    indicators: { type: Array, default: [] },
    lastUpdated: { type: Date, default: Date.now }
});

export const ChartState = mongoose.model('ChartState', ChartStateSchema);
