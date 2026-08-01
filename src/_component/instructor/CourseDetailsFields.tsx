'use client';

import { ChangeEvent, RefObject } from 'react';
import { ImagePlus, Upload, Video } from 'lucide-react';

import { ICategory } from '@/features/categories/types';
import { ICourseForData } from '@/features/courses/types';
import { Progress } from '@/components/ui/progress';

export type UploadState = { status: 'idle' | 'uploading' | 'processing' | 'done'; progress: number; fileName?: string };

interface CourseDetailsFieldsProps {
  data: ICourseForData;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  categories: ICategory[];
  thumbnailUpload: UploadState;
  videoUpload: UploadState;
  thumbnailInputRef: RefObject<HTMLInputElement | null>;
  videoInputRef: RefObject<HTMLInputElement | null>;
  onThumbnailFile: (file: File | null) => void;
  onVideoFile: (file: File | null) => void;
}

export default function CourseDetailsFields({
  data,
  onChange,
  categories,
  thumbnailUpload,
  videoUpload,
  thumbnailInputRef,
  videoInputRef,
  onThumbnailFile,
  onVideoFile,
}: CourseDetailsFieldsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 rounded-xl border border-border bg-card p-5 lg:col-span-2">
        <h2 className="text-sm font-semibold text-foreground">Basic Info</h2>

        <div>
          <label className="block text-sm font-medium text-foreground">Course Title</label>
          <input
            name="title"
            value={data.title}
            onChange={onChange}
            required
            placeholder="e.g. Complete React & Next.js Bootcamp"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">Subtitle</label>
          <input
            name="subtitle"
            value={data.subtitle ?? ''}
            onChange={onChange}
            placeholder="A short promise or transformation"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-foreground">Category</label>
            <select
              name="category"
              value={data.category as string}
              onChange={onChange}
              required
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Level</label>
            <select
              name="level"
              value={data.level ?? ''}
              onChange={onChange}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Not specified</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Language</label>
            <input
              name="language"
              value={data.language ?? ''}
              onChange={onChange}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">Duration</label>
          <input
            name="duration"
            value={data.duration}
            onChange={onChange}
            required
            placeholder="e.g. 12 hours"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">Description</label>
          <textarea
            name="courseDescription"
            value={data.courseDescription}
            onChange={onChange}
            required
            rows={5}
            placeholder="Describe the transformation, outcomes, and what students will build..."
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-1 text-sm font-semibold text-foreground">Thumbnail Upload</h2>
          <p className="mb-3 text-xs text-muted-foreground">Recommended 1280 x 720</p>
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onThumbnailFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => thumbnailInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-brand"
          >
            {data.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.thumbnail} alt="" className="h-24 w-full rounded-md object-cover" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Drop your thumbnail here or browse</span>
              </>
            )}
          </button>
          {thumbnailUpload.status !== 'idle' && thumbnailUpload.status !== 'done' && (
            <div className="mt-2">
              <Progress value={thumbnailUpload.progress} className="h-1.5" />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {thumbnailUpload.status === 'processing' ? 'Processing…' : `Uploading ${thumbnailUpload.progress}%`}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-1 text-sm font-semibold text-foreground">Promo Video Upload</h2>
          <p className="mb-3 text-xs text-muted-foreground">A short trailer for the course page</p>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => onVideoFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-brand"
          >
            {videoUpload.status === 'done' || data.promoVideoUrl ? (
              <>
                <Video className="h-6 w-6 text-success" />
                <span className="truncate text-xs text-foreground">{videoUpload.fileName ?? 'Promo video attached'}</span>
              </>
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Drop a video file or browse</span>
              </>
            )}
          </button>
          {videoUpload.status !== 'idle' && videoUpload.status !== 'done' && (
            <div className="mt-2">
              <Progress value={videoUpload.progress} className="h-1.5" />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {videoUpload.status === 'processing' ? 'Processing…' : `Uploading ${videoUpload.progress}%`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
