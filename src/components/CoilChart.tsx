import React, { useState, useRef, useEffect, useMemo } from 'react';

interface ChartPoint {
  l: number;
  B: number;
  B_mT: number;
  L_uH: number;
  layers: number;
}

interface CoilChartProps {
  data: ChartPoint[];
  currentL: number;
  optimalL: number;
  onLChange?: (newL: number) => void;
}

export default function CoilChart({ data, currentL, optimalL, onLChange }: CoilChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 320 });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Resize listener
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: Math.max(width, 300),
        height: Math.max(height, 280)
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const padding = { top: 30, right: 24, bottom: 45, left: 65 };

  // Get data extremes
  const { minL, maxL, maxB, minB, maxL_uH, minL_uH } = useMemo(() => {
    if (!data.length) return { minL: 0, maxL: 100, maxB: 1, minB: 0, maxL_uH: 10, minL_uH: 0 };
    return {
      minL: data[0].l,
      maxL: data[data.length - 1].l,
      maxB: Math.max(...data.map(d => d.B_mT)),
      minB: 0, // start ground at 0
      maxL_uH: Math.max(...data.map(d => d.L_uH)),
      minL_uH: 0,
    };
  }, [data]);

  // Scalers
  const chartWidth = dimensions.width - padding.left - padding.right;
  const chartHeight = dimensions.height - padding.top - padding.bottom;

  const scaleX = (l: number) => {
    if (maxL === minL) return padding.left;
    return padding.left + ((l - minL) / (maxL - minL)) * chartWidth;
  };

  const scaleY = (b_mT: number) => {
    if (maxB === minB) return padding.top + chartHeight;
    return padding.top + chartHeight - ((b_mT - minB) / (maxB - minB)) * chartHeight;
  };

  // Convert client coordinate back to length
  const getLengthFromX = (clientX: number) => {
    if (!containerRef.current) return currentL;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left - padding.left;
    const fraction = Math.max(0, Math.min(1, x / chartWidth));
    return minL + fraction * (maxL - minL);
  };

  // Build SVG path for B field
  const pathData = useMemo(() => {
    if (!data.length) return '';
    return data.reduce((acc, point, index) => {
      const x = scaleX(point.l);
      const y = scaleY(point.B_mT);
      return acc + `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  }, [data, scaleX, scaleY]);

  // Build filled area path
  const areaPath = useMemo(() => {
    if (!data.length) return '';
    const firstX = scaleX(data[0].l);
    const lastX = scaleX(data[data.length - 1].l);
    const baseY = padding.top + chartHeight;
    return `${pathData} L ${lastX.toFixed(1)} ${baseY.toFixed(1)} L ${firstX.toFixed(1)} ${baseY.toFixed(1)} Z`;
  }, [data, pathData, scaleX, scaleY, chartHeight, padding.top]);

  // Handle Drag / Hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!containerRef.current || !data.length) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xInSvg = e.clientX - rect.left;
    
    // Find closest index
    const dataXFraction = (xInSvg - padding.left) / chartWidth;
    const lValue = minL + dataXFraction * (maxL - minL);
    
    let closestIndex = 0;
    let minDiff = Infinity;
    
    data.forEach((p, idx) => {
      const diff = Math.abs(p.l - lValue);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });
    
    setHoverIndex(closestIndex);

    // If mouse left button is held down (dragging to change L)
    if (e.buttons === 1 && onLChange) {
      onLChange(Number(lValue.toFixed(1)));
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (onLChange) {
      const lValue = getLengthFromX(e.clientX);
      onLChange(Number(lValue.toFixed(1)));
    }
  };

  const currentPoint = useMemo(() => {
    if (!data.length) return null;
    let closestPoint = data[0];
    let minDiff = Infinity;
    data.forEach(p => {
      const diff = Math.abs(p.l - currentL);
      if (diff < minDiff) {
        minDiff = diff;
        closestPoint = p;
      }
    });
    return closestPoint;
  }, [data, currentL]);

  const optimalPoint = useMemo(() => {
    if (!data.length) return null;
    let closestPoint = data[0];
    let minDiff = Infinity;
    data.forEach(p => {
      const diff = Math.abs(p.l - optimalL);
      if (diff < minDiff) {
        minDiff = diff;
        closestPoint = p;
      }
    });
    return closestPoint;
  }, [data, optimalL]);

  // Hover point details
  const activePoint = hoverIndex !== null ? data[hoverIndex] : currentPoint;

  // Grid tick marks
  const yTicks = 5;
  const xTicks = 6;

  const yTicksData = useMemo(() => {
    const ticks = [];
    for (let i = 0; i <= yTicks; i++) {
      const val = minB + (i / yTicks) * (maxB - minB);
      ticks.push(val);
    }
    return ticks;
  }, [minB, maxB]);

  const xTicksData = useMemo(() => {
    const ticks = [];
    for (let i = 0; i < xTicks; i++) {
      const val = minL + (i / (xTicks - 1)) * (maxL - minL);
      ticks.push(val);
    }
    return ticks;
  }, [minL, maxL]);

  return (
    <div className="w-full relative flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 shadow-xl text-slate-100" id="coil-chart-card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div>
          <h3 className="font-semibold text-slate-200 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block animate-pulse"></span>
            Зависимость индукции от длины каркаса: B = f(l)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Перетаскивайте курсор по графику, чтобы мгновенно подобрать нужную длину
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs bg-slate-950/60 p-2 rounded-lg border border-slate-800/50">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Текущая l</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 clip-star bg-amber-400 inline-block" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}></span>
            <span>Оптимум B_max</span>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="w-full flex-grow relative overflow-visible select-none min-h-[300px]">
        <svg
          width="100%"
          height={dimensions.height}
          className="overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          onMouseDown={handleMouseDown}
        >
          {/* Gradients */}
          <defs>
            <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="grid-glow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#475569" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#334155" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Y Grid lines & Labels */}
          {yTicksData.map((tick, idx) => {
            const y = scaleY(tick);
            return (
              <g key={`y-grid-${idx}`} className="opacity-70">
                <line
                  x1={padding.left}
                  y1={y}
                  x2={dimensions.width - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth={1}
                  strokeDasharray={idx === 0 ? undefined : "3,3"}
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize={10}
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {tick.toFixed(3)}
                </text>
              </g>
            );
          })}

          {/* X Grid lines & Labels */}
          {xTicksData.map((tick, idx) => {
            const x = scaleX(tick);
            const yBase = padding.top + chartHeight;
            return (
              <g key={`x-grid-${idx}`} className="opacity-70">
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={yBase}
                  stroke="#1e293b"
                  strokeWidth={1}
                  strokeDasharray="3,3"
                />
                <text
                  x={x}
                  y={yBase + 16}
                  fill="#94a3b8"
                  fontSize={10}
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {tick.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Area & Path for Field B */}
          {pathData && (
            <>
              <path d={areaPath} fill="url(#chart-area-grad)" />
              <path d={pathData} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}

          {/* Vertical helper line at Current L */}
          {currentPoint && (
            <line
              x1={scaleX(currentL)}
              y1={padding.top}
              x2={scaleX(currentL)}
              y2={padding.top + chartHeight}
              stroke="#10b981"
              strokeWidth={1.5}
              strokeDasharray="4,2"
              className="pointer-events-none"
            />
          )}

          {/* Marker at Optimum Point (Gold Star highlight) */}
          {optimalPoint && (
            <g transform={`translate(${scaleX(optimalPoint.l)}, ${scaleY(optimalPoint.B_mT)})`} className="pointer-events-none">
              <circle r={10} fill="#f59e0b" className="animate-ping opacity-20" />
              <circle r={5} fill="#f59e0b" stroke="#1e293b" strokeWidth={1} />
            </g>
          )}

          {/* Marker at Current Point (Green Glow highlight) */}
          {currentPoint && (
            <g transform={`translate(${scaleX(currentL)}, ${scaleY(currentPoint.B_mT)})`} className="pointer-events-none">
              <circle r={12} fill="#10b981" className="animate-pulse opacity-30" />
              <circle r={6} fill="#10b981" stroke="#fff" strokeWidth={1.5} />
            </g>
          )}

          {/* Hover state vertical tracker */}
          {hoverIndex !== null && data[hoverIndex] && (
            <g className="pointer-events-none">
              <line
                x1={scaleX(data[hoverIndex].l)}
                y1={padding.top}
                x2={scaleX(data[hoverIndex].l)}
                y2={padding.top + chartHeight}
                stroke="#6366f1"
                strokeWidth={1}
                opacity={0.3}
              />
              <circle
                cx={scaleX(data[hoverIndex].l)}
                cy={scaleY(data[hoverIndex].B_mT)}
                r={5}
                fill="#818cf8"
                stroke="#fff"
                strokeWidth={1}
              />
            </g>
          )}

          {/* Axis Titles */}
          <text
            x={padding.left + 5}
            y={padding.top - 12}
            fill="#cbd5e1"
            fontSize={11}
            fontWeight="500"
            textAnchor="start"
          >
            Магнитная индукция B (мТл)
          </text>
          
          <text
            x={dimensions.width - padding.right}
            y={padding.top + chartHeight + 35}
            fill="#cbd5e1"
            fontSize={11}
            fontWeight="500"
            textAnchor="end"
          >
            Длина каркаса l (мм)
          </text>
        </svg>

        {/* Floating Tooltip inside container */}
        {activePoint && (
          <div
            className="absolute z-10 pointer-events-none bg-slate-950/95 border border-slate-800 p-3 rounded-lg shadow-2xl flex flex-col gap-1.5 text-xs text-slate-300 w-44 backdrop-blur-md"
            style={{
              left: `${Math.min(dimensions.width - 200, Math.max(marginForTooltip(scaleX(activePoint.l)), padding.left))}px`,
              top: `${Math.max(10, scaleY(activePoint.B_mT) - 110)}px`,
            }}
          >
            <div className="flex justify-between border-b border-slate-800 pb-1 font-semibold text-slate-200">
              <span>Длина l:</span>
              <span className="font-mono text-emerald-400">{activePoint.l.toFixed(1)} мм</span>
            </div>
            <div className="flex justify-between pt-0.5">
              <span>Поле B в центре:</span>
              <span className="font-mono font-medium text-indigo-300">
                {(activePoint.B_mT).toFixed(4)} мТл
              </span>
            </div>
            <div className="flex justify-between">
              <span>Индуктивность:</span>
              <span className="font-mono text-sky-400">
                {activePoint.L_uH >= 1000 
                  ? `${(activePoint.L_uH / 1000).toFixed(3)} мГн` 
                  : `${activePoint.L_uH.toFixed(1)} мкГн`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Число слоев k:</span>
              <span className="font-mono text-slate-400">{activePoint.layers.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper to center tooltip slightly or slide left/right
function marginForTooltip(xValue: number): number {
  return xValue - 88;
}
