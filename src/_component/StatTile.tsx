import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface StatTileProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  /** Small line under the label — e.g. "+12.4% vs last 30 days" or "from 214 reviews". */
  delta?: string;
  deltaTone?: 'positive' | 'neutral';
  colorClassName?: string;
  className?: string;
}

export default function StatTile({
  icon: Icon,
  value,
  label,
  delta,
  deltaTone = 'neutral',
  colorClassName = 'bg-palette-1-soft text-palette-1',
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border bg-card p-4',
        className
      )}
    >
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', colorClassName)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xl font-bold text-foreground">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        {delta && (
          <p
            className={cn(
              'truncate text-[11px] font-medium',
              deltaTone === 'positive' ? 'text-success' : 'text-muted-foreground'
            )}
          >
            {delta}
          </p>
        )}
      </div>
    </div>
  );
}
