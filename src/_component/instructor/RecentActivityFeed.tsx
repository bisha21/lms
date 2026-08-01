import { Star, UserPlus } from 'lucide-react';

import { IActivityItem } from '@/features/instructor/types';
import { formatRelativeTime } from '@/lib/formatRelativeTime';

interface RecentActivityFeedProps {
  items: IActivityItem[];
}

export default function RecentActivityFeed({ items }: RecentActivityFeedProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No recent activity yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <div
            className={
              item.type === 'enrollment'
                ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-palette-2-soft text-palette-2'
                : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-palette-3-soft text-palette-3'
            }
          >
            {item.type === 'enrollment' ? <UserPlus className="h-4 w-4" /> : <Star className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground">
              {item.type === 'enrollment' ? (
                <>
                  <span className="font-medium">{item.actor}</span> enrolled in{' '}
                  <span className="font-medium">{item.courseTitle}</span>
                </>
              ) : (
                <>
                  <span className="font-medium">{item.actor}</span> left a {item.rating}-star review on{' '}
                  <span className="font-medium">{item.courseTitle}</span>
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground">{formatRelativeTime(item.date)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
