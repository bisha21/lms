interface LineChartDatum {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineChartDatum[];
  height?: number;
  formatValue?: (value: number) => string;
  formatLabel?: (label: string) => string;
}

// Sequential, single-hue line + area (trend over time) — brand hue, 2px line, ~10%
// area wash, hairline gridlines. Hover hit-zones carry per-point tooltips.
export default function LineChart({
  data,
  height = 220,
  formatValue = (v) => String(v),
  formatLabel = (l) => l,
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        No data yet
      </div>
    );
  }

  const width = 100;
  const max = Math.max(...data.map((d) => d.value), 1);
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: i * stepX,
    y: height - (d.value / max) * (height - 8) - 4,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  const gridLines = [0.25, 0.5, 0.75];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {gridLines.map((g) => (
          <line
            key={g}
            x1={0}
            x2={width}
            y1={height * g}
            y2={height * g}
            className="stroke-border"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path d={areaPath} className="fill-brand" fillOpacity={0.1} stroke="none" />
        <path
          d={linePath}
          className="stroke-brand"
          fill="none"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="absolute inset-0 flex">
        {points.map((p, i) => (
          <div
            key={`${p.label}-${i}`}
            className="flex-1"
            title={`${formatLabel(p.label)}: ${formatValue(p.value)}`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        <span>{formatLabel(data[0].label)}</span>
        <span>{formatLabel(data[data.length - 1].label)}</span>
      </div>
    </div>
  );
}
