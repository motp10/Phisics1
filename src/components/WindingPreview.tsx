import React from 'react';
import { CoilCalculationResults } from '../types';

interface WindingPreviewProps {
  results: CoilCalculationResults;
  inputs: {
    wireLength: number;
    wireDiameter: number;
    frameDiameter: number;
    frameLength: number;
  };
}

export default function WindingPreview({ results, inputs }: WindingPreviewProps) {
  const {
    lengthM,
    frameDiameterM,
    outerDiameter,
    windingThickness,
    layers,
    layersInt,
    layersFrac,
    totalTurns,
    turnsPerLayer
  } = results;

  // Visual limits and padding
  const svgWidth = 480;
  const svgHeight = 260;
  const padX = 60;
  const padY = 50;

  const drawableWidth = svgWidth - 2 * padX;
  const drawableHeight = svgHeight - 2 * padY;

  // Scale calculations for fitting the schematic safely on screen.
  // We want to scale based on the largest dimension (outer diameter vs coil length)
  const maxPhysicalDim = Math.max(inputs.frameLength * 1.5, inputs.frameDiameter * 2.2, 30); // in mm equivalent
  const scale = (drawableWidth * 0.70) / maxPhysicalDim; // scale factor

  // Computed visual sizes
  const vLength = inputs.frameLength * scale;
  const vFrameDiam = inputs.frameDiameter * scale;
  const vWindingThick = (windingThickness * 1000) * scale;
  const vOuterDiam = vFrameDiam + 2 * vWindingThick;
  const vWireDiam = inputs.wireDiameter * scale;

  // Center coordinate of the canvas
  const cx = svgWidth / 2;
  const cy = svgHeight / 2;

  // Bobbin cylinder bounding positions
  const xLeft = cx - vLength / 2;
  const xRight = cx + vLength / 2;
  const yTopBobbin = cy - vFrameDiam / 2;
  const yBottomBobbin = cy + vFrameDiam / 2;

  // We can render a set number of turns for rendering. Since actual turns can be thousands,
  // we cap the drawn circles to a visible representation (e.g., maximum 20 along the length and 6 layered deep).
  const maxDrawnCols = Math.min(Math.max(Math.floor(inputs.frameLength / inputs.wireDiameter), 2), 24);
  const maxDrawnRows = Math.min(Math.max(layersInt + (layersFrac > 0 ? 1 : 0), 1), 7);

  // Wire radius for rendering
  const rWire = Math.max(vWireDiam / 2, 1.5);

  // Generate copper dots positions
  const copperDots: { x: number; y: number; layerIdx: number; isTop: boolean; opacity: number }[] = [];

  for (let r = 0; r < maxDrawnRows; r++) {
    // Layer opacity / color shift
    const opacity = r === layersInt ? layersFrac : 1.0;
    if (opacity <= 0.05) continue;

    // Radius offset for this layer
    // Stacking up vertically from the bobbin surface
    const yOffset = vWindingThick * (r / maxDrawnRows);
    
    const yTopLayer = yTopBobbin - yOffset - rWire;
    const yBottomLayer = yBottomBobbin + yOffset + rWire;

    // Draw cols along length
    for (let c = 0; c < maxDrawnCols; c++) {
      // Space turns evenly across frame length
      const colFraction = maxDrawnCols > 1 ? c / (maxDrawnCols - 1) : 0.5;
      const x = xLeft + colFraction * (vLength - 2 * rWire) + rWire;

      // Add dual top & bottom cross-section representation
      copperDots.push({ x, y: yTopLayer, layerIdx: r, isTop: true, opacity });
      copperDots.push({ x, y: yBottomLayer, layerIdx: r, isTop: false, opacity });
    }
  }

  // Choose a layer color palette
  const getLayerColor = (idx: number) => {
    const colors = [
      '#f97316', // Orange Copper
      '#ea580c', // Dark Orange
      '#ea580c', // Darker
      '#c2410c',
      '#9a3412',
      '#7c2d12',
      '#431407',
    ];
    return colors[idx % colors.length];
  };

  // Field intensity factor based on calculated field B (relative to active current scaling)
  const fieldFactor = Math.min(results.magneticFieldContinuous * 1000 * 2.0, 1.0); // glow intensity

  return (
    <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col items-center justify-center relative shadow-lg overflow-hidden" id="coil-schematic-card">
      <div className="absolute top-3 left-4 text-xs font-semibold text-slate-400 tracking-wider uppercase">
        Эскиз намотки в разрезе
      </div>

      <svg width={svgWidth} height={svgHeight} className="overflow-visible">
        {/* Core Magnetic Field Lines (Glowing paths going through the center of coil) */}
        {results.magneticFieldContinuous > 0 && (
          <g opacity={0.15 + fieldFactor * 0.35}>
            {/* Axial Core line */}
            <line
              x1={10}
              y1={cy}
              x2={svgWidth - 10}
              y2={cy}
              stroke="#6366f1"
              strokeWidth={3}
              strokeDasharray="8,4"
              className="animate-[dash_2s_linear_infinite]"
              style={{
                strokeDashoffset: 100,
              }}
            />
            {/* Arched loop lines */}
            <path
              d={`M ${xLeft} ${cy} C ${xLeft - 40} ${cy - vFrameDiam}, ${xRight + 40} ${cy - vFrameDiam}, ${xRight} ${cy}`}
              fill="none"
              stroke="#818cf8"
              strokeWidth={1.5}
            />
            <path
              d={`M ${xLeft} ${cy} C ${xLeft - 40} ${cy + vFrameDiam}, ${xRight + 40} ${cy + vFrameDiam}, ${xRight} ${cy}`}
              fill="none"
              stroke="#818cf8"
              strokeWidth={1.5}
            />
            <path
              d={`M ${xLeft - vLength/3} ${cy} C ${xLeft - 90} ${cy - vFrameDiam - 30}, ${xRight + 90} ${cy - vFrameDiam - 30}, ${xRight + vLength/3} ${cy}`}
              fill="none"
              stroke="#4f46e5"
              strokeWidth={1}
            />
            <path
              d={`M ${xLeft - vLength/3} ${cy} C ${xLeft - 90} ${cy + vFrameDiam + 30}, ${xRight + 90} ${cy + vFrameDiam + 30}, ${xRight + vLength/3} ${cy}`}
              fill="none"
              stroke="#4f46e5"
              strokeWidth={1}
            />
          </g>
        )}

        {/* Cylinder Bobbin Frame Wall Background */}
        <rect
          x={xLeft}
          y={yTopBobbin}
          width={vLength}
          height={vFrameDiam}
          fill="#1e293b"
          rx={2}
          opacity={0.3}
          stroke="#334155"
          strokeWidth={1.5}
        />

        {/* Central Bobbin Core Axis Line */}
        <line
          x1={xLeft - 25}
          y1={cy}
          x2={xRight + 25}
          y2={cy}
          stroke="#475569"
          strokeWidth={1}
          strokeDasharray="5,5"
        />

        {/* Front Metal Bobbin Flanges (ends of the spool) */}
        <rect
          x={xLeft - 4}
          y={yTopBobbin - vWindingThick - rWire * 3}
          width={5}
          height={vFrameDiam + 2 * (vWindingThick + rWire * 3)}
          fill="#475569"
          rx={1}
        />
        <rect
          x={xRight - 1}
          y={yTopBobbin - vWindingThick - rWire * 3}
          width={5}
          height={vFrameDiam + 2 * (vWindingThick + rWire * 3)}
          fill="#475569"
          rx={1}
        />

        {/* Copper Wires Cross-Sections (as circles stacking on top & bottom walls) */}
        {copperDots.map((dot, index) => (
          <circle
            key={`wire-${index}`}
            cx={dot.x}
            cy={dot.y}
            r={rWire}
            fill={getLayerColor(dot.layerIdx)}
            stroke="#1e1b4b"
            strokeWidth={0.5}
            opacity={dot.opacity}
          />
        ))}

        {/* Schematic Labels & Dimension Arrows */}
        {/* Winding Length L Indicator */}
        <g transform={`translate(0, ${cy + vFrameDiam/2 + vWindingThick + rWire*4 + 20})`}>
          <line x1={xLeft} y1={0} x2={xRight} y2={0} stroke="#cbd5e1" strokeWidth={1} />
          <line x1={xLeft} y1={-4} x2={xLeft} y2={4} stroke="#cbd5e1" strokeWidth={1} />
          <line x1={xRight} y1={-4} x2={xRight} y2={4} stroke="#cbd5e1" strokeWidth={1} />
          <text
            x={cx}
            y={-5}
            fill="#94a3b8"
            fontSize={11}
            textAnchor="middle"
            fontWeight="bold"
            className="font-mono bg-slate-950 px-1"
          >
            l = {inputs.frameLength.toFixed(1)} мм
          </text>
        </g>

        {/* Frame Diameter D Indicator (Left axis vertical) */}
        <g transform={`translate(${xLeft - 22}, 0)`}>
          <line x1={0} y1={yTopBobbin} x2={0} y2={yBottomBobbin} stroke="#cbd5e1" strokeWidth={1} />
          <line x1={-4} y1={yTopBobbin} x2={4} y2={yTopBobbin} stroke="#cbd5e1" strokeWidth={1} />
          <line x1={-4} y1={yBottomBobbin} x2={4} y2={yBottomBobbin} stroke="#cbd5e1" strokeWidth={1} />
          <text
            x={-6}
            y={cy + 4}
            fill="#94a3b8"
            fontSize={11}
            textAnchor="end"
            fontWeight="bold"
            className="font-mono"
          >
            D = {inputs.frameDiameter} мм
          </text>
        </g>

        {/* Outer Diameter D_outer Indicator (Right axis vertical) */}
        {vWindingThick > 1 && (
          <g transform={`translate(${xRight + 22}, 0)`}>
            <line x1={0} y1={yTopBobbin - vWindingThick} x2={0} y2={yBottomBobbin + vWindingThick} stroke="#f97316" strokeWidth={1} />
            <line x1={-4} y1={yTopBobbin - vWindingThick} x2={4} y2={yTopBobbin - vWindingThick} stroke="#f97316" strokeWidth={1} />
            <line x1={-4} y1={yBottomBobbin + vWindingThick} x2={4} y2={yBottomBobbin + vWindingThick} stroke="#f97316" strokeWidth={1} />
            <text
              x={6}
              y={cy + 4}
              fill="#f97316"
              fontSize={11}
              textAnchor="start"
              fontWeight="bold"
              className="font-mono"
            >
              D_внеш ≈ {(outerDiameter * 1000).toFixed(1)} мм
            </text>
          </g>
        )}
      </svg>

      {/* Layer Statistics Tag */}
      <div className="mt-2 flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-lg py-1 px-3 text-xs">
        <span className="text-slate-400">Слои намотки k:</span>
        <span className="font-mono font-bold text-orange-400">{layers.toFixed(2)}</span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">Всего витков N:</span>
        <span className="font-mono font-bold text-indigo-400">{Math.round(totalTurns)}</span>
      </div>
    </div>
  );
}
