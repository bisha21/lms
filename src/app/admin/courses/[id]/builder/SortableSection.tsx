'use client';

import { useState } from 'react';
import { closestCenter, DndContext, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, GripVertical, Pencil, Plus, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ISection } from '@/features/sections/types';
import { SortableLesson } from './SortableLesson';

interface SortableSectionProps {
  section: ISection;
  onEditSection: () => void;
  onDeleteSection: () => void;
  onAddLesson: () => void;
  onEditLesson: (lessonId: string) => void;
  onDeleteLesson: (lessonId: string) => void;
  onReorderLessons: (orderedIds: string[]) => void;
}

export function SortableSection({
  section,
  onEditSection,
  onDeleteSection,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onReorderLessons,
}: SortableSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section._id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const lessonIds = section.lessons.map((lesson) => lesson._id);

  function handleLessonDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = lessonIds.indexOf(active.id as string);
    const newIndex = lessonIds.indexOf(over.id as string);
    onReorderLessons(arrayMove(lessonIds, oldIndex, newIndex));
  }

  return (
    <li ref={setNodeRef} style={style} className="bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between px-4 py-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Drag to reorder section"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button
            onClick={() => setExpanded((current) => !current)}
            className="text-muted-foreground shrink-0"
            aria-label={expanded ? 'Collapse section' : 'Expand section'}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <span className="font-medium text-foreground truncate">{section.title}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            ({section.lessons.length} lesson{section.lessons.length === 1 ? '' : 's'})
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="outline" size="sm" onClick={onAddLesson}>
            <Plus className="h-4 w-4" /> Lesson
          </Button>
          <Button variant="outline" size="icon" onClick={onEditSection} aria-label="Edit section">
            <Pencil className="h-4 w-4" color="blue" />
          </Button>
          <Button variant="outline" size="icon" onClick={onDeleteSection} aria-label="Delete section">
            <Trash className="h-4 w-4" color="red" />
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4">
          {section.lessons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lessons yet.</p>
          ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleLessonDragEnd}>
              <SortableContext items={lessonIds} strategy={verticalListSortingStrategy}>
                <ol className="space-y-1">
                  {section.lessons.map((lesson, index) => (
                    <SortableLesson
                      key={lesson._id}
                      lesson={lesson}
                      index={index}
                      onEdit={() => onEditLesson(lesson._id)}
                      onDelete={() => onDeleteLesson(lesson._id)}
                    />
                  ))}
                </ol>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </li>
  );
}
