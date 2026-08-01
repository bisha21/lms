'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, GripVertical, PlayCircle, Trash } from 'lucide-react';

import { ILessonContent } from '@/features/lessons/types';
import { cn } from '@/lib/utils';

function formatDuration(seconds?: number) {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface CurriculumLectureRowProps {
  lesson: ILessonContent;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function CurriculumLectureRow({ lesson, selected, onSelect, onDelete }: CurriculumLectureRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson._id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        'flex cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-2 transition-colors',
        selected ? 'border-brand bg-palette-1-soft' : 'border-border bg-background hover:border-brand/50'
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="cursor-grab text-muted-foreground hover:text-foreground"
          aria-label="Drag to reorder lecture"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {lesson.contentType === 'pdf' ? (
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <PlayCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate text-sm text-foreground">{lesson.title}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs text-muted-foreground">{formatDuration(lesson.durationSeconds)}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
          {lesson.contentType}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete lecture"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
