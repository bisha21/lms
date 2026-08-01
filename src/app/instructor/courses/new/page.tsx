'use client';

import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useCategories } from '@/features/categories/hooks';
import { useCreateCourse } from '@/features/courses/hooks';
import { ICourseForData } from '@/features/courses/types';
import { useCourseAssetUpload } from '@/hooks/useCourseAssetUpload';
import { Button } from '@/components/ui/button';
import CourseWizardShell from '@/_component/instructor/CourseWizardShell';
import CourseDetailsFields from '@/_component/instructor/CourseDetailsFields';

const emptyForm: ICourseForData = {
  title: '',
  subtitle: '',
  courseDescription: '',
  coursePrice: 0,
  category: '',
  duration: '',
  thumbnail: '',
  level: undefined,
  language: 'English',
};

export default function NewCoursePage() {
  const router = useRouter();
  const { data: categories = [] } = useCategories();
  const createCourse = useCreateCourse();

  const [data, setData] = useState<ICourseForData>(emptyForm);
  const { thumbnailUpload, videoUpload, handleThumbnailFile, handleVideoFile } = useCourseAssetUpload(setData);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: name === 'coursePrice' ? Number(value) : value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createCourse.mutate(
      { ...data, status: 'draft' },
      {
        onSuccess: (course) => router.push(`/instructor/courses/${course._id}/curriculum`),
      }
    );
  }

  const canContinue =
    data.title && data.courseDescription && data.category && data.duration && !createCourse.isPending;

  return (
    <CourseWizardShell
      step={1}
      footer={
        <>
          <span />
          <Button onClick={handleSubmit} disabled={!canContinue}>
            {createCourse.isPending ? 'Creating...' : 'Continue to Curriculum'}
          </Button>
        </>
      }
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Create New Course</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Build your course foundation, then move through curriculum, pricing, and publishing.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <CourseDetailsFields
          data={data}
          onChange={handleChange}
          categories={categories}
          thumbnailUpload={thumbnailUpload}
          videoUpload={videoUpload}
          thumbnailInputRef={thumbnailInputRef}
          videoInputRef={videoInputRef}
          onThumbnailFile={handleThumbnailFile}
          onVideoFile={handleVideoFile}
        />
      </form>
    </CourseWizardShell>
  );
}
