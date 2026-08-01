import Link from 'next/link';
import { motion } from 'framer-motion';
import { PlayCircle } from 'lucide-react';

import { IContinueLearningItem } from '@/features/progress/types';
import { Progress } from '@/components/ui/progress';

interface ContinueLearningCardProps {
  item: IContinueLearningItem;
}

export default function ContinueLearningCard({ item }: ContinueLearningCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="w-64 shrink-0"
    >
      <Link
        href={`/courses/${item.course.slug}/learn`}
        className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {item.course.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.course.thumbnail}
              alt={item.course.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              No preview
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
            <PlayCircle className="h-9 w-9 text-white" />
          </div>
        </div>
        <div className="flex flex-col gap-2 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {item.course.title}
          </h3>
          <Progress value={item.percent} className="h-1.5" />
          <p className="text-xs text-muted-foreground">{item.percent}% complete</p>
        </div>
      </Link>
    </motion.div>
  );
}
