import { cn } from '@/lib/utils';

interface BarChartDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartDatum[];
  colorClassName?: string;
  height?: number;
  formatValue?: (value: number) => string;
  formatLabel?: (label: string) => string;
}

// Sequential, single-hue bar chart (magnitude over time) — no legend needed for one
// series; the card title above it names what's plotted. Hover shows the exact value.
export default function BarChart({
  data,
  colorClassName = 'bg-brand',
  height = 160,
  formatValue = (v) => String(v),
  formatLabel = (l) => l,
}: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        No data yet
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height }}>
        {data.map((d, i) => {
          const barHeight = Math.max((d.value / max) * height, 2);
          return (
            <div
              key={`${d.label}-${i}`}
              className="group relative flex flex-1 flex-col justify-end"
              title={`${formatLabel(d.label)}: ${formatValue(d.value)}`}
            >
              <div
                className={cn('mx-auto w-full max-w-[18px] rounded-t transition-opacity group-hover:opacity-80', colorClassName)}
                style={{ height: barHeight }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        <span>{formatLabel(data[0].label)}</span>
        <span>{formatLabel(data[data.length - 1].label)}</span>
      </div>
    </div>
  );
}
