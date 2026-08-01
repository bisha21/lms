'use client';

import { useState } from 'react';
import { closestCenter, DndContext, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, GripVertical, Plus, Trash } from 'lucide-react';

import { ISection } from '@/features/sections/types';
import { CurriculumLectureRow } from './CurriculumLectureRow';

interface CurriculumSectionCardProps {
  section: ISection;
  selectedLessonId?: string;
  onSelectLesson: (lessonId: string) => void;
  onDeleteLesson: (lessonId: string) => void;
  onAddLesson: () => void;
  onDeleteSection: () => void;
  onReorderLessons: (orderedIds: string[]) => void;
}

export function CurriculumSectionCard({
  section,
  selectedLessonId,
  onSelectLesson,
  onDeleteLesson,
  onAddLesson,
  onDeleteSection,
  onReorderLessons,
}: CurriculumSectionCardProps) {
  const [expanded, setExpanded] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section._id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const lessonIds = section.lessons.map((l) => l._id);

  function handleLessonDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = lessonIds.indexOf(active.id as string);
    const newIndex = lessonIds.indexOf(over.id as string);
    onReorderLessons(arrayMove(lessonIds, oldIndex, newIndex));
  }

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab text-muted-foreground hover:text-foreground"
            aria-label="Drag to reorder section"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground"
            aria-label={expanded ? 'Collapse section' : 'Expand section'}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{section.title}</p>
            <p className="text-xs text-muted-foreground">
              {section.lessons.length} lecture{section.lessons.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <button
          onClick={onDeleteSection}
          aria-label="Delete section"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="space-y-2 px-4 pb-4">
          {section.lessons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lectures yet.</p>
          ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleLessonDragEnd}>
              <SortableContext items={lessonIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {section.lessons.map((lesson) => (
                    <CurriculumLectureRow
                      key={lesson._id}
                      lesson={lesson}
                      selected={lesson._id === selectedLessonId}
                      onSelect={() => onSelectLesson(lesson._id)}
                      onDelete={() => onDeleteLesson(lesson._id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
          <button
            onClick={onAddLesson}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-xs font-medium text-muted-foreground hover:border-brand hover:text-brand"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Lecture
          </button>
        </div>
      )}
    </div>
  );
}
