import React, { useState, useRef, useEffect } from 'react';
import { useChart } from '../../context/ChartContext';
import type { Drawing, Point } from '../../context/ChartContext';

export const DrawingOverlay: React.FC = () => {
    const { chart, series, drawingMode, setDrawingMode, drawings, addDrawing, removeDrawing, data } = useChart();
    const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
    const svgRef = useRef<SVGSVGElement>(null);
    const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);

    // Helper to convert chart coordinates to screen coordinates
    const toScreen = (p: Point) => {
        try {
            if (!chart || !series) return null;
            const timeScale = chart.timeScale();
            const x = timeScale.timeToCoordinate(p.time as any);
            const y = series.priceToCoordinate(p.price);
            if (x === null || y === null) return null;
            return { x, y };
        } catch (e) {
            return null;
        }
    };

    // Helper to convert screen coordinates to chart coordinates
    const toChart = (x: number, y: number): Point | null => {
        try {
            if (!chart || !series) return null;
            const timeScale = chart.timeScale();
            const time = timeScale.coordinateToTime(x);
            const price = series.coordinateToPrice(y);
            if (time === null || price === null) return null;
            return { time: time as number, price };
        } catch (e) {
            return null;
        }
    };

    const getSnappedPoint = (x: number, y: number) => {
        if (!chart || !series) return { x, y };

        let snappedX = x;
        let snappedY = y;

        const rawPoint = toChart(x, y);
        if (rawPoint) {
            const timeScale = chart.timeScale();
            const coordinate = timeScale.timeToCoordinate(rawPoint.time as any);

            if (coordinate !== null && Math.abs(coordinate - x) < 20) {
                snappedX = coordinate;

                const candle = (data || []).find(c => new Date(c.timestamp).getTime() / 1000 === rawPoint.time);
                if (candle) {
                    const prices = [candle.open, candle.high, candle.low, candle.close];
                    let minDist = Infinity;
                    let closestPrice = null;

                    prices.forEach(p => {
                        const py = series.priceToCoordinate(p);
                        if (py !== null) {
                            const dist = Math.abs(py - y);
                            if (dist < 20) {
                                if (dist < minDist) {
                                    minDist = dist;
                                    closestPrice = p;
                                }
                            }
                        }
                    });

                    if (closestPrice !== null) {
                        const py = series.priceToCoordinate(closestPrice);
                        if (py !== null) snappedY = py;
                    }
                }
            }
        }
        return { x: snappedX, y: snappedY };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (drawingMode === 'cursor') return;
        if (!chart || !series) return;

        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Apply magnet logic to the click point as well
        let point = toChart(x, y);
        if (!point) return;

        const snapped = getSnappedPoint(x, y);
        if (snapped) {
            const snappedChartPoint = toChart(snapped.x, snapped.y);
            if (snappedChartPoint) point = snappedChartPoint;
        }

        if (drawingMode === 'rectangle') {
            if (currentPoints.length === 0) {
                setCurrentPoints([point]);
            } else {
                // Finish rectangle
                const newDrawing: Drawing = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'rectangle',
                    points: [currentPoints[0], point],
                    color: '#2962FF'
                };
                addDrawing(newDrawing);
                setCurrentPoints([]);
                setDrawingMode('cursor');
            }
        } else if (drawingMode === 'path') {
            setCurrentPoints([...currentPoints, point]);
        } else if (drawingMode === 'fibonacci') {
            if (currentPoints.length === 0) {
                setCurrentPoints([point]);
            } else {
                // Finish fibonacci
                const newDrawing: Drawing = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'fibonacci',
                    points: [currentPoints[0], point],
                    color: '#2962FF'
                };
                addDrawing(newDrawing);
                setCurrentPoints([]);
                setDrawingMode('cursor');
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const snapped = getSnappedPoint(x, y);
        setMousePos(snapped);
    };

    const handleDoubleClick = () => {
        if (drawingMode === 'path' && currentPoints.length > 1) {
            const newDrawing: Drawing = {
                id: Math.random().toString(36).substr(2, 9),
                type: 'path',
                points: currentPoints,
                color: '#2962FF'
            };
            addDrawing(newDrawing);
            setCurrentPoints([]);
            setDrawingMode('cursor');
        }
    };

    // Force update when chart scrolls/zooms
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    useEffect(() => {
        if (!chart) return;
        const timeScale = chart.timeScale();
        const handleTimeScaleChange = () => forceUpdate();
        timeScale.subscribeVisibleLogicalRangeChange(handleTimeScaleChange);
        return () => timeScale.unsubscribeVisibleLogicalRangeChange(handleTimeScaleChange);
    }, [chart]);

    const renderDrawing = (d: Drawing) => {
        if (d.type === 'rectangle') {
            const p1 = toScreen(d.points[0]);
            const p2 = toScreen(d.points[1]);
            if (!p1 || !p2) return null;

            const x = Math.min(p1.x, p2.x);
            const y = Math.min(p1.y, p2.y);
            const width = Math.abs(p1.x - p2.x);
            const height = Math.abs(p1.y - p2.y);

            return (
                <g key={d.id}>
                    <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill={d.color}
                        fillOpacity={0.2}
                        stroke={d.color}
                        strokeWidth={2}
                    />
                    <text
                        x={x + width} y={y}
                        fill="red"
                        fontSize="16"
                        fontWeight="bold"
                        cursor="pointer"
                        pointerEvents="auto"
                        onClick={(e) => { e.stopPropagation(); removeDrawing(d.id); }}
                    >
                        ×
                    </text>
                </g>
            );
        } else if (d.type === 'path') {
            const screenPoints = d.points.map(toScreen).filter(p => p !== null) as { x: number, y: number }[];
            if (screenPoints.length < 2) return null;
            const pathData = `M ${screenPoints.map(p => `${p.x},${p.y}`).join(' L ')}`;
            return (
                <g key={d.id}>
                    <path
                        d={pathData}
                        stroke={d.color}
                        strokeWidth={2}
                        fill="none"
                    />
                    <text
                        x={screenPoints[screenPoints.length - 1].x} y={screenPoints[screenPoints.length - 1].y}
                        fill="red"
                        fontSize="16"
                        fontWeight="bold"
                        cursor="pointer"
                        pointerEvents="auto"
                        onClick={(e) => { e.stopPropagation(); removeDrawing(d.id); }}
                    >
                        ×
                    </text>
                </g>
            );
        } else if (d.type === 'fibonacci') {
            const p1 = toScreen(d.points[0]);
            const p2 = toScreen(d.points[1]);
            if (!p1 || !p2) return null;

            const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
            const diffY = p2.y - p1.y;

            return (
                <g key={d.id}>
                    {/* Trend line */}
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={d.color} strokeWidth={1} strokeDasharray="4 4" />

                    {/* Levels */}
                    {levels.map(level => {
                        const y = p1.y + diffY * level;
                        return (
                            <g key={level}>
                                <line
                                    x1={Math.min(p1.x, p2.x)}
                                    y1={y}
                                    x2={Math.max(p1.x, p2.x)}
                                    y2={y}
                                    stroke={d.color}
                                    strokeWidth={1}
                                />
                                <text
                                    x={Math.max(p1.x, p2.x) + 5}
                                    y={y + 4}
                                    fill={d.color}
                                    fontSize="10"
                                >
                                    {level}
                                </text>
                            </g>
                        );
                    })}
                    <text
                        x={Math.max(p1.x, p2.x)} y={p1.y}
                        fill="red"
                        fontSize="16"
                        fontWeight="bold"
                        cursor="pointer"
                        pointerEvents="auto"
                        onClick={(e) => { e.stopPropagation(); removeDrawing(d.id); }}
                    >
                        ×
                    </text>
                </g>
            );
        }
        return null;
    };

    const renderPreview = () => {
        if (currentPoints.length === 0 || !mousePos) return null;

        // Use mousePos directly as it is already in screen coordinates (and snapped)
        const currentScreenPoint = mousePos;

        if (drawingMode === 'rectangle') {
            const p1 = toScreen(currentPoints[0]);
            if (!p1) return null;

            const x = Math.min(p1.x, currentScreenPoint.x);
            const y = Math.min(p1.y, currentScreenPoint.y);
            const width = Math.abs(p1.x - currentScreenPoint.x);
            const height = Math.abs(p1.y - currentScreenPoint.y);

            return (
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill="#2962FF"
                    fillOpacity={0.1}
                    stroke="#2962FF"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                />
            );
        } else if (drawingMode === 'path') {
            const screenPoints = currentPoints.map(toScreen).filter(p => p !== null) as { x: number, y: number }[];
            screenPoints.push(currentScreenPoint);

            if (screenPoints.length < 2) return null;
            const pathData = `M ${screenPoints.map(p => `${p.x},${p.y}`).join(' L ')}`;
            return (
                <path
                    d={pathData}
                    stroke="#2962FF"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    fill="none"
                />
            );
        } else if (drawingMode === 'fibonacci') {
            const p1 = toScreen(currentPoints[0]);
            if (!p1) return null;
            const p2 = currentScreenPoint;

            const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
            const diffY = p2.y - p1.y;

            return (
                <g>
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#2962FF" strokeWidth={1} strokeDasharray="4 4" />
                    {levels.map(level => {
                        const y = p1.y + diffY * level;
                        return (
                            <line
                                key={level}
                                x1={Math.min(p1.x, p2.x)}
                                y1={y}
                                x2={Math.max(p1.x, p2.x)}
                                y2={y}
                                stroke="#2962FF"
                                strokeWidth={1}
                                strokeDasharray="2 2"
                            />
                        );
                    })}
                </g>
            );
        }
        return null;
    };

    return (
        <div className="absolute inset-0 z-20 pointer-events-none">
            <svg
                ref={svgRef}
                className="w-full h-full pointer-events-auto"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onDoubleClick={handleDoubleClick}
            >
                {drawings.map(renderDrawing)}
                {renderPreview()}

                {/* Crosshair / Magnet Cursor */}
                {mousePos && drawingMode !== 'cursor' && (
                    <g>
                        <circle cx={mousePos.x} cy={mousePos.y} r={4} fill="rgba(41, 98, 255, 0.5)" stroke="#2962FF" strokeWidth={1} />
                        <line x1={mousePos.x} y1={0} x2={mousePos.x} y2="100%" stroke="#2962FF" strokeWidth={0.5} strokeDasharray="4 4" opacity={0.5} />
                        <line x1={0} y1={mousePos.y} x2="100%" y2={mousePos.y} stroke="#2962FF" strokeWidth={0.5} strokeDasharray="4 4" opacity={0.5} />
                    </g>
                )}
            </svg>
        </div>
    );
};
