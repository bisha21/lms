import { ICategory } from '@/features/categories/types';
import { cn } from '@/lib/utils';

const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const RATING_OPTIONS = [
  { value: '4', label: '4 & up' },
  { value: '3', label: '3 & up' },
  { value: '2', label: '2 & up' },
  { value: '1', label: '1 & up' },
];

interface CourseFilterSidebarProps {
  categories: ICategory[];
  category: string;
  onCategoryChange: (value: string) => void;
  level: string;
  onLevelChange: (value: string) => void;
  language: string;
  onLanguageChange: (value: string) => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  minRating: string;
  onMinRatingChange: (value: string) => void;
  onReset: () => void;
}

function FilterRow({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm text-foreground hover:bg-accent"
    >
      <span
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border',
          checked && 'border-primary bg-primary'
        )}
      >
        {checked && <span className="h-2 w-2 rounded-sm bg-primary-foreground" />}
      </span>
      {label}
    </button>
  );
}

export default function CourseFilterSidebar({
  categories,
  category,
  onCategoryChange,
  level,
  onLevelChange,
  language,
  onLanguageChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  minRating,
  onMinRatingChange,
  onReset,
}: CourseFilterSidebarProps) {
  return (
    <aside className="flex w-full flex-col gap-6 lg:w-64 lg:shrink-0">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Filters</h2>
        <button type="button" onClick={onReset} className="text-xs font-medium text-brand hover:underline">
          Reset all
        </button>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Category
        </h3>
        <div className="flex flex-col">
          {categories.map((c) => (
            <FilterRow
              key={c._id}
              label={c.name}
              checked={category === c._id}
              onClick={() => onCategoryChange(category === c._id ? '' : c._id)}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Level</h3>
        <div className="flex flex-col">
          {LEVEL_OPTIONS.map((option) => (
            <FilterRow
              key={option.value}
              label={option.label}
              checked={level === option.value}
              onClick={() => onLevelChange(level === option.value ? '' : option.value)}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Price range
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm"
          />
          <span className="text-muted-foreground">&ndash;</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rating</h3>
        <div className="flex flex-col">
          {RATING_OPTIONS.map((option) => (
            <FilterRow
              key={option.value}
              label={`★ ${option.label}`}
              checked={minRating === option.value}
              onClick={() => onMinRatingChange(minRating === option.value ? '' : option.value)}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Language
        </h3>
        <input
          type="text"
          placeholder="e.g. English"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm"
        />
      </div>
    </aside>
  );
}
