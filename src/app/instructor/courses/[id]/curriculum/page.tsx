'use client';

import { useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { closestCenter, DndContext, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FileText, Paperclip, Plus, Upload, X } from 'lucide-react';

import { useCourse } from '@/features/courses/hooks';
import {
  useCreateSection,
  useDeleteSection,
  useReorderSections,
  useSections,
  useUpdateSection,
} from '@/features/sections/hooks';
import { ISection } from '@/features/sections/types';
import {
  useAddLessonAttachment,
  useCreateLesson,
  useDeleteLesson,
  useDeleteLessonAttachment,
  useReorderLessons,
  useUpdateLesson,
} from '@/features/lessons/hooks';
import { ILessonContent, LessonContentTypeValue } from '@/features/lessons/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Modal from '@/_component/Modal';
import CourseWizardShell from '@/_component/instructor/CourseWizardShell';
import { CurriculumSectionCard } from '@/_component/instructor/CurriculumSectionCard';

type SectionModalState = { mode: 'add' } | { mode: 'edit'; section: ISection } | null;
type LessonModalState = { sectionId: string } | null;

export default function InstructorCurriculumPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: sections = [], isLoading: sectionsLoading } = useSections(courseId);

  const createSection = useCreateSection(courseId);
  const updateSection = useUpdateSection(courseId);
  const deleteSection = useDeleteSection(courseId);
  const reorderSections = useReorderSections(courseId);
  const createLesson = useCreateLesson(courseId);
  const deleteLesson = useDeleteLesson(courseId);
  const updateLesson = useUpdateLesson(courseId);
  const reorderLessons = useReorderLessons(courseId);
  const addAttachment = useAddLessonAttachment(courseId);
  const deleteAttachment = useDeleteLessonAttachment(courseId);

  const [sectionModal, setSectionModal] = useState<SectionModalState>(null);
  const [sectionTitle, setSectionTitle] = useState('');
  const [deletingSection, setDeletingSection] = useState<ISection | null>(null);

  const [lessonModal, setLessonModal] = useState<LessonModalState>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonContentType, setLessonContentType] = useState<LessonContentTypeValue>('video');
  const [lessonFile, setLessonFile] = useState<File | null>(null);

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [attachmentProgress, setAttachmentProgress] = useState(0);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const sectionIds = sections.map((s) => s._id);
  const selectedLesson: ILessonContent | undefined = sections
    .flatMap((s) => s.lessons)
    .find((l) => l._id === selectedLessonId);

  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sectionIds.indexOf(active.id as string);
    const newIndex = sectionIds.indexOf(over.id as string);
    reorderSections.mutate(arrayMove(sectionIds, oldIndex, newIndex));
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

  function submitLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!lessonModal || !lessonFile) return;
    createLesson.mutate(
      {
        sectionId: lessonModal.sectionId,
        data: {
          title: lessonTitle,
          description: lessonDescription,
          contentType: lessonContentType,
          video: lessonContentType === 'video' ? (lessonFile ?? undefined) : undefined,
          pdf: lessonContentType === 'pdf' ? (lessonFile ?? undefined) : undefined,
        },
      },
      { onSuccess: () => setLessonModal(null) }
    );
  }

  function handleAttachFile(file: File | null) {
    if (!file || !selectedLessonId) return;
    setAttachmentProgress(0);
    addAttachment.mutate(
      { lessonId: selectedLessonId, file, onProgress: setAttachmentProgress },
      { onSettled: () => setAttachmentProgress(0) }
    );
  }

  if (courseLoading || sectionsLoading || !course) {
    return <p className="mx-auto max-w-6xl px-6 py-10 text-muted-foreground">Loading...</p>;
  }

  return (
    <CourseWizardShell
      courseTitle={course.title}
      step={2}
      footer={
        <>
          <Button variant="outline" onClick={() => router.push('/instructor/courses')}>
            Back
          </Button>
          <Button onClick={() => router.push(`/instructor/courses/${courseId}/pricing`)}>
            Continue to Pricing
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">Curriculum Manager</h1>
              <p className="text-sm text-muted-foreground">Drag, reorder, and structure your course content.</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setSectionTitle('');
                setSectionModal({ mode: 'add' });
              }}
            >
              <Plus className="h-4 w-4" />
              Add Section
            </Button>
          </div>

          {sections.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No sections yet — add one to get started.
            </p>
          ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
              <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {sections.map((section) => (
                    <CurriculumSectionCard
                      key={section._id}
                      section={section}
                      selectedLessonId={selectedLessonId ?? undefined}
                      onSelectLesson={setSelectedLessonId}
                      onDeleteLesson={(lessonId) => {
                        if (lessonId === selectedLessonId) setSelectedLessonId(null);
                        deleteLesson.mutate(lessonId);
                      }}
                      onAddLesson={() => {
                        setLessonTitle('');
                        setLessonDescription('');
                        setLessonContentType('video');
                        setLessonFile(null);
                        setLessonModal({ sectionId: section._id });
                      }}
                      onDeleteSection={() => setDeletingSection(section)}
                      onReorderLessons={(orderedIds) =>
                        reorderLessons.mutate({ sectionId: section._id, orderedIds })
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Lecture Editor</h2>
            {selectedLesson && (
              <Badge variant="secondary" className="uppercase">
                {selectedLesson.contentType}
              </Badge>
            )}
          </div>

          {!selectedLesson ? (
            <p className="text-sm text-muted-foreground">Select a lecture on the left to edit its details.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center rounded-lg border border-border bg-muted p-4">
                {selectedLesson.contentType === 'pdf' ? (
                  <a
                    href={selectedLesson.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-brand hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    View PDF
                  </a>
                ) : (
                  <video src={selectedLesson.videoUrl} controls className="max-h-40 w-full rounded-md" />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground">Title</label>
                <input
                  key={selectedLesson._id}
                  defaultValue={selectedLesson.title}
                  onBlur={(e) => {
                    if (e.target.value && e.target.value !== selectedLesson.title) {
                      updateLesson.mutate({ id: selectedLesson._id, data: { title: e.target.value } });
                    }
                  }}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground">Duration (seconds)</label>
                <input
                  key={`${selectedLesson._id}-duration`}
                  type="number"
                  min={0}
                  defaultValue={selectedLesson.durationSeconds ?? 0}
                  onBlur={(e) => {
                    const value = Number(e.target.value);
                    if (value !== (selectedLesson.durationSeconds ?? 0)) {
                      updateLesson.mutate({ id: selectedLesson._id, data: { durationSeconds: value } });
                    }
                  }}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Resources</label>
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => handleAttachFile(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => attachmentInputRef.current?.click()}
                    className="flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    Attach file
                  </button>
                </div>
                {addAttachment.isPending && (
                  <div className="mb-2">
                    <Progress value={attachmentProgress} className="h-1.5" />
                  </div>
                )}
                {selectedLesson.attachments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No files attached yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {selectedLesson.attachments.map((a) => (
                      <li
                        key={a._id}
                        className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5"
                      >
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-w-0 items-center gap-2 text-xs text-foreground hover:text-brand"
                        >
                          <Upload className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{a.name}</span>
                          <span className="shrink-0 text-muted-foreground">
                            {(a.size / 1024 / 1024).toFixed(1)} MB
                          </span>
                        </a>
                        <button
                          onClick={() =>
                            deleteAttachment.mutate({ lessonId: selectedLesson._id, attachmentId: a._id })
                          }
                          aria-label="Remove attachment"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit section */}
      <Modal
        open={!!sectionModal}
        onOpenChange={(open) => !open && setSectionModal(null)}
        header={{
          title: sectionModal?.mode === 'edit' ? 'Edit Section' : 'Add Section',
          description: 'Sections group related lectures together.',
        }}
      >
        <form onSubmit={submitSection} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Title</label>
            <input
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
            ? `This will also delete ${deletingSection.lessons.length} lecture(s) in this section. This cannot be undone.`
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

      {/* Add lecture */}
      <Modal
        open={!!lessonModal}
        onOpenChange={(open) => !open && setLessonModal(null)}
        header={{ title: 'Add Lecture', description: 'Upload a lecture video or PDF for this section.' }}
      >
        <form onSubmit={submitLesson} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Title</label>
            <input
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Description</label>
            <textarea
              value={lessonDescription}
              onChange={(e) => setLessonDescription(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Content type</label>
            <div className="flex gap-4 text-sm text-foreground">
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
          <div>
            <label className="block text-sm font-medium text-foreground">
              {lessonContentType === 'pdf' ? 'PDF file' : 'Video file'}
            </label>
            <input
              type="file"
              accept={lessonContentType === 'pdf' ? 'application/pdf' : 'video/*'}
              required
              onChange={(e) => setLessonFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm"
            />
          </div>
          <Button type="submit" className="w-full">
            Upload lecture
          </Button>
        </form>
      </Modal>
    </CourseWizardShell>
  );
}
