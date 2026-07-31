'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ILessonContent } from '@/features/lessons/types';

interface SortableLessonProps {
  lesson: ILessonContent;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function SortableLesson({ lesson, index, onEdit, onDelete }: SortableLessonProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson._id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-2"
    >
      <div className="flex items-center gap-2 min-w-0">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-400 hover:text-gray-600 shrink-0"
          aria-label="Drag to reorder lesson"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-sm text-gray-800 truncate">
          {index + 1}. {lesson.title}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="outline" size="icon" onClick={onEdit} aria-label="Edit lesson">
          <Pencil className="h-4 w-4" color="blue" />
        </Button>
        <Button variant="outline" size="icon" onClick={onDelete} aria-label="Delete lesson">
          <Trash className="h-4 w-4" color="red" />
        </Button>
      </div>
    </li>
  );
}
