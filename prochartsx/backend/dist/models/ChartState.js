"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChartState = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ChartStateSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true, default: 'default-user' }, // Simple user ID for now
    drawings: { type: Array, default: [] },
    indicators: { type: Array, default: [] },
    lastUpdated: { type: Date, default: Date.now }
});
exports.ChartState = mongoose_1.default.model('ChartState', ChartStateSchema);
