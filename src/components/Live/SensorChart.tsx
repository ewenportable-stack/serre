import { useState } from "react";

interface ChartPoint {
  t: number;
  value: number;
}

interface SensorChartProps {
  data: ChartPoint[];
  color: string;
  unit: string;
  min: number;
  max: number;
  height?: number;
}

const WIDTH = 420;
const PADDING = { top: 12, right: 12, bottom: 20, left: 34 };

export function SensorChart({ data, color, unit, min, max, height = 150 }: SensorChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return <div className="sensor-chart-empty">En attente de données…</div>;
  }

  const innerW = WIDTH - PADDING.left - PADDING.right;
  const innerH = height - PADDING.top - PADDING.bottom;
  const span = max - min || 1;

  const xFor = (i: number) => PADDING.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const yFor = (v: number) => PADDING.top + innerH - ((v - min) / span) * innerH;

  const linePoints = data.map((d, i) => `${xFor(i)},${yFor(d.value)}`).join(" ");
  const areaPoints = `${xFor(0)},${PADDING.top + innerH} ${linePoints} ${xFor(data.length - 1)},${PADDING.top + innerH}`;
  const gridValues = [min, (min + max) / 2, max];
  const lastIndex = data.length - 1;
  const lastPoint = data[lastIndex];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = (relX - PADDING.left) / innerW;
    const idx = Math.round(ratio * lastIndex);
    setHoverIndex(Math.min(lastIndex, Math.max(0, idx)));
  };

  const hovered = hoverIndex !== null ? data[hoverIndex] : null;
  const hoveredX = hoverIndex !== null ? xFor(hoverIndex) : 0;
  const tooltipLeftPct = Math.min(88, Math.max(12, (hoveredX / WIDTH) * 100));

  return (
    <div className="sensor-chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        width="100%"
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {gridValues.map((g) => (
          <g key={g}>
            <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={yFor(g)} y2={yFor(g)} stroke="#e2e8f0" strokeWidth={1} />
            <text x={PADDING.left - 6} y={yFor(g) + 3} fontSize={9} fill="#94a3b8" textAnchor="end">
              {Math.round(g)}
            </text>
          </g>
        ))}
        <polygon points={areaPoints} fill={color} opacity={0.1} />
        <polyline points={linePoints} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <text
          x={xFor(lastIndex)}
          y={Math.max(PADDING.top + 9, yFor(lastPoint.value) - 9)}
          fontSize={11}
          fontWeight={600}
          fill="#0f172a"
          textAnchor="end"
        >
          {lastPoint.value.toFixed(1)} {unit}
        </text>
        <circle cx={xFor(lastIndex)} cy={yFor(lastPoint.value)} r={5} fill="#ffffff" />
        <circle cx={xFor(lastIndex)} cy={yFor(lastPoint.value)} r={4} fill={color} />
        {hovered && (
          <>
            <line x1={hoveredX} x2={hoveredX} y1={PADDING.top} y2={PADDING.top + innerH} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3,3" />
            <circle cx={hoveredX} cy={yFor(hovered.value)} r={4} fill={color} stroke="#ffffff" strokeWidth={2} />
          </>
        )}
      </svg>
      {hovered && (
        <div className="sensor-chart-tooltip" style={{ left: `${tooltipLeftPct}%` }}>
          <strong>
            {hovered.value.toFixed(1)} {unit}
          </strong>
          <span>{new Date(hovered.t).toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}
