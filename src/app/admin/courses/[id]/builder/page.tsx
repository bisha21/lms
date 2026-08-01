'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { closestCenter, DndContext, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Modal from '@/_component/Modal';
import CourseForm from '@/_component/CourseForm';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { closeModal, openModal } from '@/redux/modal/modalSlice';
import { useCourse, useTogglePublishCourse } from '@/features/courses/hooks';
import {
  useCreateSection,
  useDeleteSection,
  useReorderSections,
  useSections,
  useUpdateSection,
} from '@/features/sections/hooks';
import { ISection } from '@/features/sections/types';
import {
  useCreateLesson,
  useDeleteLesson,
  useReorderLessons,
  useUpdateLesson,
} from '@/features/lessons/hooks';
import { ILessonContent, LessonContentTypeValue } from '@/features/lessons/types';
import { SortableSection } from './SortableSection';

type SectionModalState = { mode: 'add' } | { mode: 'edit'; section: ISection } | null;
type LessonModalState =
  | { mode: 'add'; sectionId: string }
  | { mode: 'edit'; sectionId: string; lesson: ILessonContent }
  | null;

export default function CourseBuilderPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { isOpen, type, data: modalData } = useAppSelector((store) => store.modal);

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: sections = [], isLoading: sectionsLoading } = useSections(courseId);

  const togglePublish = useTogglePublishCourse();
  const createSection = useCreateSection(courseId);
  const updateSection = useUpdateSection(courseId);
  const deleteSection = useDeleteSection(courseId);
  const reorderSections = useReorderSections(courseId);
  const createLesson = useCreateLesson(courseId);
  const updateLesson = useUpdateLesson(courseId);
  const deleteLesson = useDeleteLesson(courseId);
  const reorderLessons = useReorderLessons(courseId);

  const [sectionModal, setSectionModal] = useState<SectionModalState>(null);
  const [sectionTitle, setSectionTitle] = useState('');
  const [deletingSection, setDeletingSection] = useState<ISection | null>(null);

  const [lessonModal, setLessonModal] = useState<LessonModalState>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonContentType, setLessonContentType] = useState<LessonContentTypeValue>('video');
  const [lessonVideo, setLessonVideo] = useState<File | null>(null);
  const [lessonPdf, setLessonPdf] = useState<File | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<{ section: ISection; lesson: ILessonContent } | null>(
    null
  );

  const sectionIds = sections.map((section) => section._id);

  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sectionIds.indexOf(active.id as string);
    const newIndex = sectionIds.indexOf(over.id as string);
    reorderSections.mutate(arrayMove(sectionIds, oldIndex, newIndex));
  }

  function openAddSection() {
    setSectionTitle('');
    setSectionModal({ mode: 'add' });
  }
  function openEditSection(section: ISection) {
    setSectionTitle(section.title);
    setSectionModal({ mode: 'edit', section });
  }
  function submitSection(e: React.FormEvent) {
    e.preventDefault();
    if (!sectionModal) return;
    if (sectionModal.mode === 'add') {
      createSection.mutate({ title: sectionTitle }, { onSuccess: () => setSectionModal(null) });
    } else {
      updateSection.mutate(
        { id: sectionModal.section._id, title: sectionTitle },
        { onSuccess: () => setSectionModal(null) }
      );
    }
  }

  function openAddLesson(sectionId: string) {
    setLessonTitle('');
    setLessonDescription('');
    setLessonContentType('video');
    setLessonVideo(null);
    setLessonPdf(null);
    setLessonModal({ mode: 'add', sectionId });
  }
  function openEditLesson(sectionId: string, lesson: ILessonContent) {
    setLessonTitle(lesson.title);
    setLessonDescription(lesson.description);
    setLessonContentType(lesson.contentType);
    setLessonVideo(null);
    setLessonPdf(null);
    setLessonModal({ mode: 'edit', sectionId, lesson });
  }
  function submitLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!lessonModal) return;
    if (lessonModal.mode === 'add') {
      if (lessonContentType === 'pdf' ? !lessonPdf : !lessonVideo) return;
      createLesson.mutate(
        {
          sectionId: lessonModal.sectionId,
          data: {
            title: lessonTitle,
            description: lessonDescription,
            contentType: lessonContentType,
            video: lessonVideo ?? undefined,
            pdf: lessonPdf ?? undefined,
          },
        },
        { onSuccess: () => setLessonModal(null) }
      );
    } else {
      updateLesson.mutate(
        { id: lessonModal.lesson._id, data: { title: lessonTitle, description: lessonDescription } },
        { onSuccess: () => setLessonModal(null) }
      );
    }
  }

  if (courseLoading || sectionsLoading) {
    return <p className="max-w-4xl mx-auto px-6 py-10">Loading...</p>;
  }
  if (!course) {
    return <p className="max-w-4xl mx-auto px-6 py-10">Course not found.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{course.title}</h1>
          <p className="text-sm text-gray-500">{course.courseDescription}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              togglePublish.mutate({
                id: courseId,
                status: course.status === 'published' ? 'draft' : 'published',
              })
            }
            className={`px-3 py-1 rounded-full text-xs ${
              course.status === 'published'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {course.status === 'published' ? 'Published' : 'Draft'}
          </button>
          <Button variant="outline" onClick={() => dispatch(openModal({ type: 'edit', data: course }))}>
            Edit Details
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Curriculum</h2>
        <Button onClick={openAddSection}>
          <Plus className="h-4 w-4" /> Add Section
        </Button>
      </div>

      {sections.length === 0 ? (
        <p className="text-gray-500">No sections yet — add one to get started.</p>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
          <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
            <ol className="space-y-3">
              {sections.map((section) => (
                <SortableSection
                  key={section._id}
                  section={section}
                  onEditSection={() => openEditSection(section)}
                  onDeleteSection={() => setDeletingSection(section)}
                  onAddLesson={() => openAddLesson(section._id)}
                  onEditLesson={(lessonId) => {
                    const lesson = section.lessons.find((l) => l._id === lessonId);
                    if (lesson) openEditLesson(section._id, lesson);
                  }}
                  onDeleteLesson={(lessonId) => {
                    const lesson = section.lessons.find((l) => l._id === lessonId);
                    if (lesson) setDeletingLesson({ section, lesson });
                  }}
                  onReorderLessons={(orderedIds) =>
                    reorderLessons.mutate({ sectionId: section._id, orderedIds })
                  }
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      {/* Course details — reuses the same shared modal slice + CourseForm as the admin courses list */}
      <Modal
        open={isOpen && type === 'edit'}
        onOpenChange={(open) => !open && dispatch(closeModal())}
        header={{ title: 'Edit Course Details', description: 'Update the course details.' }}
      >
        <CourseForm defaultValues={type === 'edit' ? modalData : undefined} />
      </Modal>

      {/* Add/Edit section */}
      <Modal
        open={!!sectionModal}
        onOpenChange={(open) => !open && setSectionModal(null)}
        header={{
          title: sectionModal?.mode === 'edit' ? 'Edit Section' : 'Add Section',
          description: 'Sections group related lessons together.',
        }}
      >
        <form onSubmit={submitSection} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              required
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            />
          </div>
          <Button type="submit" className="w-full">
            {sectionModal?.mode === 'edit' ? 'Save changes' : 'Add section'}
          </Button>
        </form>
      </Modal>

      {/* Delete section confirmation */}
      <Modal
        open={!!deletingSection}
        onOpenChange={(open) => !open && setDeletingSection(null)}
        header={{
          title: 'Delete Section',
          description: deletingSection
            ? `This will also delete ${deletingSection.lessons.length} lesson(s) in this section. This cannot be undone.`
            : '',
        }}
      >
        <div className="flex justify-between">
          <Button
            variant="destructive"
            onClick={() => {
              if (deletingSection) deleteSection.mutate(deletingSection._id);
              setDeletingSection(null);
            }}
          >
            Yes, Delete
          </Button>
          <Button onClick={() => setDeletingSection(null)}>Cancel</Button>
        </div>
      </Modal>

      {/* Add/Edit lesson */}
      <Modal
        open={!!lessonModal}
        onOpenChange={(open) => !open && setLessonModal(null)}
        header={{
          title: lessonModal?.mode === 'edit' ? 'Edit Lesson' : 'Add Lesson',
          description: 'Upload a lesson video or PDF for this section.',
        }}
      >
        <form onSubmit={submitLesson} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              required
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={lessonDescription}
              onChange={(e) => setLessonDescription(e.target.value)}
              required
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            />
          </div>
          {lessonModal?.mode === 'add' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content type</label>
                <div className="flex gap-4 text-sm text-gray-700">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={lessonContentType === 'video'}
                      onChange={() => setLessonContentType('video')}
                    />
                    Video
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={lessonContentType === 'pdf'}
                      onChange={() => setLessonContentType('pdf')}
                    />
                    PDF
                  </label>
                </div>
              </div>
              {lessonContentType === 'video' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Video file</label>
                  <input
                    type="file"
                    accept="video/*"
                    required
                    onChange={(e) => setLessonVideo(e.target.files?.[0] ?? null)}
                    className="w-full mt-1"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700">PDF file</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    required
                    onChange={(e) => setLessonPdf(e.target.files?.[0] ?? null)}
                    className="w-full mt-1"
                  />
                </div>
              )}
            </>
          )}
          <Button type="submit" className="w-full">
            {lessonModal?.mode === 'edit' ? 'Save changes' : 'Upload lesson'}
          </Button>
        </form>
      </Modal>

      {/* Delete lesson confirmation */}
      <Modal
        open={!!deletingLesson}
        onOpenChange={(open) => !open && setDeletingLesson(null)}
        header={{
          title: 'Delete Confirmation',
          description: 'Are you sure you want to delete this lesson?',
        }}
      >
        <div className="flex justify-between">
          <Button
            variant="destructive"
            onClick={() => {
              if (deletingLesson) deleteLesson.mutate(deletingLesson.lesson._id);
              setDeletingLesson(null);
            }}
          >
            Yes, Delete
          </Button>
          <Button onClick={() => setDeletingLesson(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
