import React, { useState, useRef, useEffect } from 'react';
import { useChart } from '../../context/ChartContext';
import type { Drawing, Point } from '../../context/ChartContext';

export const DrawingOverlay: React.FC = () => {
    const {
        chart,
        series,
        drawingMode,
        setDrawingMode,
        drawings,
        addDrawing,
        removeDrawing,
        data,
        selectedDrawingId,
        setSelectedDrawing,
    } = useChart();

    const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
    const svgRef = useRef<SVGSVGElement>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
    const [hoveredDrawingId, setHoveredDrawingId] = useState<string | null>(null);

    // Convert chart point to screen coordinates
    const toScreen = (p: Point) => {
        if (!chart || !series) return null;
        const timeScale = chart.timeScale();
        const x = timeScale.timeToCoordinate(p.time as any);
        const y = series.priceToCoordinate(p.price);
        if (x === null || y === null) return null;
        return { x, y };
    };

    // Convert screen coordinates to chart point
    const toChart = (x: number, y: number): Point | null => {
        if (!chart || !series) return null;
        const timeScale = chart.timeScale();
        const time = timeScale.coordinateToTime(x);
        const price = series.coordinateToPrice(y);
        if (time === null || price === null) return null;
        return { time: time as number, price };
    };

    // Snap to nearest candle point if close enough
    const getSnappedPoint = (x: number, y: number) => {
        if (!chart || !series) return { x, y };
        let snappedX = x;
        let snappedY = y;
        const raw = toChart(x, y);
        if (raw) {
            const timeScale = chart.timeScale();
            const coord = timeScale.timeToCoordinate(raw.time as any);
            if (coord !== null && Math.abs(coord - x) < 20) {
                snappedX = coord;
                const candle = (data || []).find(c => new Date(c.timestamp).getTime() / 1000 === raw.time);
                if (candle) {
                    const prices = [candle.open, candle.high, candle.low, candle.close];
                    let best = null;
                    let bestDist = Infinity;
                    prices.forEach(p => {
                        const py = series.priceToCoordinate(p);
                        if (py !== null) {
                            const dist = Math.abs(py - y);
                            if (dist < 20 && dist < bestDist) {
                                bestDist = dist;
                                best = p;
                            }
                        }
                    });
                    if (best !== null) {
                        const py = series.priceToCoordinate(best);
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
        let point = toChart(x, y);
        if (!point) return;
        const snapped = getSnappedPoint(x, y);
        if (snapped) {
            const snappedChart = toChart(snapped.x, snapped.y);
            if (snappedChart) point = snappedChart;
        }
        if (drawingMode === 'rectangle') {
            if (currentPoints.length === 0) {
                setCurrentPoints([point]);
            } else {
                const newDrawing: Drawing = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'rectangle',
                    points: [currentPoints[0], point],
                    color: '#2962FF',
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
                const newDrawing: Drawing = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'fibonacci',
                    points: [currentPoints[0], point],
                    color: '#2962FF',
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
                color: '#2962FF',
            };
            addDrawing(newDrawing);
            setCurrentPoints([]);
            setDrawingMode('cursor');
        }
    };

    // Force re‑render on zoom/pan
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    useEffect(() => {
        if (!chart) return;
        const ts = chart.timeScale();
        const cb = () => forceUpdate();
        ts.subscribeVisibleLogicalRangeChange(cb);
        return () => ts.unsubscribeVisibleLogicalRangeChange(cb);
    }, [chart]);

    // Keyboard shortcuts: Delete selected, Escape to cancel
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && selectedDrawingId) {
                removeDrawing(selectedDrawingId);
            } else if (e.key === 'Escape') {
                setSelectedDrawing(null);
                if (drawingMode !== 'cursor') {
                    setDrawingMode('cursor');
                    setCurrentPoints([]);
                }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selectedDrawingId, removeDrawing, setSelectedDrawing, drawingMode, setDrawingMode]);

    const renderRectangle = (d: Drawing) => {
        const p1 = toScreen(d.points[0]);
        const p2 = toScreen(d.points[1]);
        if (!p1 || !p2) return null;
        const x = Math.min(p1.x, p2.x);
        const y = Math.min(p1.y, p2.y);
        const w = Math.abs(p1.x - p2.x);
        const h = Math.abs(p1.y - p2.y);
        const isSelected = selectedDrawingId === d.id;
        const isHovered = hoveredDrawingId === d.id;
        const stroke = isSelected ? '#ff6600' : d.color || '#00f';
        const width = isSelected ? 3 : isHovered ? 2.5 : 2;
        const opacity = isSelected ? 0.3 : isHovered ? 0.25 : 0.2;
        return (
            <g key={d.id}
                onMouseEnter={() => setHoveredDrawingId(d.id)}
                onMouseLeave={() => setHoveredDrawingId(null)}
                onClick={e => { e.stopPropagation(); setSelectedDrawing(d.id); }}
                cursor="pointer"
            >
                <rect x={x} y={y} width={w} height={h}
                    fill={d.color}
                    fillOpacity={opacity}
                    stroke={stroke}
                    strokeWidth={width}
                />
                <text x={x + w - 8} y={y + 12}
                    fill="red"
                    fontSize="14"
                    fontWeight="bold"
                    cursor="pointer"
                    onClick={e => { e.stopPropagation(); removeDrawing(d.id); }}
                >×</text>
            </g>
        );
    };

    const renderPath = (d: Drawing) => {
        const screenPts = d.points.map(toScreen).filter(Boolean) as { x: number; y: number }[];
        if (screenPts.length < 2) return null;
        const path = `M ${screenPts.map(p => `${p.x},${p.y}`).join(' L ')}`;
        const isSelected = selectedDrawingId === d.id;
        const isHovered = hoveredDrawingId === d.id;
        const stroke = isSelected ? '#ff6600' : d.color || '#00f';
        const width = isSelected ? 3 : isHovered ? 2.5 : 2;
        const last = screenPts[screenPts.length - 1];
        return (
            <g key={d.id}
                onMouseEnter={() => setHoveredDrawingId(d.id)}
                onMouseLeave={() => setHoveredDrawingId(null)}
                onClick={e => { e.stopPropagation(); setSelectedDrawing(d.id); }}
                cursor="pointer"
            >
                <path d={path} fill="none" stroke={stroke} strokeWidth={width} />
                <text x={last.x - 8} y={last.y - 4}
                    fill="red"
                    fontSize="14"
                    fontWeight="bold"
                    cursor="pointer"
                    onClick={e => { e.stopPropagation(); removeDrawing(d.id); }}
                >×</text>
            </g>
        );
    };

    const renderFibonacci = (d: Drawing) => {
        const p1 = toScreen(d.points[0]);
        const p2 = toScreen(d.points[1]);
        if (!p1 || !p2) return null;
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        const diffY = p2.y - p1.y;
        const isSelected = selectedDrawingId === d.id;
        const isHovered = hoveredDrawingId === d.id;
        const stroke = isSelected ? '#ff6600' : d.color || '#00f';
        const width = isSelected ? 2 : isHovered ? 1.5 : 1;
        return (
            <g key={d.id}
                onMouseEnter={() => setHoveredDrawingId(d.id)}
                onMouseLeave={() => setHoveredDrawingId(null)}
                onClick={e => { e.stopPropagation(); setSelectedDrawing(d.id); }}
                cursor="pointer"
            >
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={stroke} strokeWidth={width} strokeDasharray="4 4" />
                {levels.map(r => {
                    const y = p1.y + diffY * r;
                    return (
                        <line key={r}
                            x1={Math.min(p1.x, p2.x)}
                            y1={y}
                            x2={Math.max(p1.x, p2.x)}
                            y2={y}
                            stroke={stroke}
                            strokeWidth={width}
                        />
                    );
                })}
                <text x={Math.max(p1.x, p2.x) - 8} y={p1.y - 4}
                    fill="red"
                    fontSize="14"
                    fontWeight="bold"
                    cursor="pointer"
                    onClick={e => { e.stopPropagation(); removeDrawing(d.id); }}
                >×</text>
            </g>
        );
    };

    const renderDrawing = (d: Drawing) => {
        switch (d.type) {
            case 'rectangle':
                return renderRectangle(d);
            case 'path':
                return renderPath(d);
            case 'fibonacci':
                return renderFibonacci(d);
            default:
                return null;
        }
    };

    const renderPreview = () => {
        if (currentPoints.length === 0 || !mousePos) return null;
        const cur = mousePos;
        if (drawingMode === 'rectangle') {
            const p1 = toScreen(currentPoints[0]);
            if (!p1) return null;
            const x = Math.min(p1.x, cur.x);
            const y = Math.min(p1.y, cur.y);
            const w = Math.abs(p1.x - cur.x);
            const h = Math.abs(p1.y - cur.y);
            return (
                <rect x={x} y={y} width={w} height={h}
                    fill="#2962FF"
                    fillOpacity={0.1}
                    stroke="#2962FF"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                />
            );
        }
        if (drawingMode === 'path') {
            const pts = currentPoints.map(toScreen).filter(Boolean) as { x: number; y: number }[];
            pts.push(cur);
            if (pts.length < 2) return null;
            const d = `M ${pts.map(p => `${p.x},${p.y}`).join(' L ')}`;
            return <path d={d} fill="none" stroke="#2962FF" strokeWidth={1} strokeDasharray="4 4" />;
        }
        if (drawingMode === 'fibonacci') {
            const p1 = toScreen(currentPoints[0]);
            if (!p1) return null;
            const p2 = cur;
            const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
            const diffY = p2.y - p1.y;
            return (
                <g>
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#2962FF" strokeWidth={1} strokeDasharray="4 4" />
                    {levels.map(r => {
                        const y = p1.y + diffY * r;
                        return (
                            <line key={r}
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
