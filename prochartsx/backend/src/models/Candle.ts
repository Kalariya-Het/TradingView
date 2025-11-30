// src/models/Candle.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ICandle extends Document {
    timestamp: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

const CandleSchema = new Schema<ICandle>({
    timestamp: { type: Date, required: true },
    open: { type: Number, required: true },
    high: { type: Number, required: true },
    low: { type: Number, required: true },
    close: { type: Number, required: true },
    volume: { type: Number, required: true },
});

export const Candle = mongoose.model<ICandle>('Candle', CandleSchema);
