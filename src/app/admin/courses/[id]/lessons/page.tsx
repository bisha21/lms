'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  useCreateLesson,
  useDeleteLesson,
  useLessons,
  useReorderLesson,
  useUpdateLesson,
} from '@/features/lessons/hooks';
import { Button } from '@/components/ui/button';
import Modal from '@/_component/Modal';
import { Pencil, Trash, ArrowUp, ArrowDown } from 'lucide-react';
import { ILesson } from '@/features/lessons/types';

export default function CourseLessonsPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const { data: lessons = [] } = useLessons(courseId);
  const createLesson = useCreateLesson(courseId);
  const updateLesson = useUpdateLesson(courseId);
  const reorderLesson = useReorderLesson(courseId);
  const deleteLesson = useDeleteLesson(courseId);

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<ILesson | null>(null);
  const [deleting, setDeleting] = useState<ILesson | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [video, setVideo] = useState<File | null>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setVideo(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video) return;
    await createLesson.mutateAsync({ title, description, video });
    resetForm();
    setAddOpen(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    await updateLesson.mutateAsync({ id: editing._id, data: { title, description } });
    setEditing(null);
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = lessons[index + direction];
    const current = lessons[index];
    if (!target || !current) return;
    await reorderLesson.mutateAsync({ id: current._id, order: target.order });
    await reorderLesson.mutateAsync({ id: target._id, order: current.order });
  };

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Lessons</h1>
        <Button onClick={() => setAddOpen(true)}>+ Add Lesson</Button>
      </div>

      <ol className="space-y-2">
        {lessons.map((lesson, index) => (
          <li
            key={lesson._id}
            className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-4 py-3"
          >
            <div>
              <p className="font-medium text-gray-900">
                {index + 1}. {lesson.title}
              </p>
              <p className="text-sm text-gray-500">{lesson.description}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => move(index, -1)} disabled={index === 0}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => move(index, 1)}
                disabled={index === lessons.length - 1}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setEditing(lesson);
                  setTitle(lesson.title);
                  setDescription(lesson.description);
                }}
              >
                <Pencil className="h-4 w-4" color="blue" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setDeleting(lesson)}>
                <Trash className="h-4 w-4" color="red" />
              </Button>
            </div>
          </li>
        ))}
        {lessons.length === 0 && <p className="text-gray-500">No lessons yet.</p>}
      </ol>

      <Modal
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) resetForm();
        }}
        header={{ title: 'Add Lesson', description: 'Upload a lesson video for this course.' }}
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Video file</label>
            <input
              type="file"
              accept="video/*"
              required
              onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
              className="w-full mt-1"
            />
          </div>
          <Button type="submit" className="w-full">
            Upload lesson
          </Button>
        </form>
      </Modal>

      <Modal
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        header={{ title: 'Edit Lesson', description: 'Update the lesson details.' }}
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            />
          </div>
          <Button type="submit" className="w-full">
            Save changes
          </Button>
        </form>
      </Modal>

      <Modal
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        header={{ title: 'Delete Confirmation', description: 'Are you sure you want to delete this lesson?' }}
      >
        <div className="flex justify-between">
          <Button
            variant="destructive"
            onClick={() => {
              if (deleting) deleteLesson.mutate(deleting._id);
              setDeleting(null);
            }}
          >
            Yes, Delete
          </Button>
          <Button onClick={() => setDeleting(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
