import { cn } from '@/lib/utils';

export interface CourseTabOption {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface CourseTabsProps {
  options: CourseTabOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function CourseTabs({ options, value, onChange }: CourseTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
            value === option.value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-foreground hover:bg-accent'
          )}
        >
          {option.label}
          {typeof option.count === 'number' && (
            <span className="ml-1.5 opacity-70">({option.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
