'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Layers, Wallet } from 'lucide-react';

import { useCategories } from '@/features/categories/hooks';
import { useCourse, useUpdateCourse } from '@/features/courses/hooks';
import { ICourseForData } from '@/features/courses/types';
import { useCourseAssetUpload } from '@/hooks/useCourseAssetUpload';
import { Button } from '@/components/ui/button';
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

export default function EditCoursePage() {
  const { id: courseId } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: categories = [] } = useCategories();
  const { data: course, isLoading } = useCourse(courseId);
  const updateCourse = useUpdateCourse();

  const [data, setData] = useState<ICourseForData>(emptyForm);
  const { thumbnailUpload, videoUpload, handleThumbnailFile, handleVideoFile } = useCourseAssetUpload(setData);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!course) return;
    setData({
      ...course,
      category: typeof course.category === 'string' ? course.category : course.category?._id ?? '',
    });
  }, [course]);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: name === 'coursePrice' ? Number(value) : value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateCourse.mutate(
      { id: courseId, data },
      { onSuccess: () => router.push('/instructor/courses') }
    );
  }

  if (isLoading || !course) {
    return <p className="mx-auto max-w-6xl px-6 py-10 text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <p className="mb-1 text-xs font-medium text-muted-foreground">
        <Link href="/instructor/courses" className="hover:text-foreground">
          Courses
        </Link>
        <span className="mx-1.5">&gt;</span>
        <span className="text-foreground">Edit</span>
      </p>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Update your course details.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/instructor/courses/${courseId}/curriculum`}>
            <Button variant="outline" size="sm">
              <Layers className="h-4 w-4" />
              Curriculum
            </Button>
          </Link>
          <Link href={`/instructor/courses/${courseId}/pricing`}>
            <Button variant="outline" size="sm">
              <Wallet className="h-4 w-4" />
              Pricing
            </Button>
          </Link>
        </div>
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

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push('/instructor/courses')}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateCourse.isPending}>
            {updateCourse.isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
