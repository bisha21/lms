'use client';

import { useState } from 'react';
import { useUploadCoursePromoVideo, useUploadCourseThumbnail } from '@/features/courses/hooks';
import { ICourseForData } from '@/features/courses/types';
import { UploadState } from '@/_component/instructor/CourseDetailsFields';

const idle: UploadState = { status: 'idle', progress: 0 };

// Shared by the course creation wizard's Basic Info step and the course edit page — both
// upload a thumbnail/promo video the same way and just fold the resulting URL/publicId
// into their own form state via setData.
export function useCourseAssetUpload(setData: (updater: (prev: ICourseForData) => ICourseForData) => void) {
  const uploadThumbnail = useUploadCourseThumbnail();
  const uploadPromoVideo = useUploadCoursePromoVideo();

  const [thumbnailUpload, setThumbnailUpload] = useState<UploadState>(idle);
  const [videoUpload, setVideoUpload] = useState<UploadState>(idle);

  function handleThumbnailFile(file: File | null) {
    if (!file) return;
    setThumbnailUpload({ status: 'uploading', progress: 0, fileName: file.name });
    uploadThumbnail.mutate(
      {
        file,
        onProgress: (progress) =>
          setThumbnailUpload((prev) => ({ ...prev, progress, status: progress < 100 ? 'uploading' : 'processing' })),
      },
      {
        onSuccess: ({ url, publicId }) => {
          setData((prev) => ({ ...prev, thumbnail: url, thumbnailPublicId: publicId }));
          setThumbnailUpload({ status: 'done', progress: 100, fileName: file.name });
        },
        onError: () => setThumbnailUpload(idle),
      }
    );
  }

  function handleVideoFile(file: File | null) {
    if (!file) return;
    setVideoUpload({ status: 'uploading', progress: 0, fileName: file.name });
    uploadPromoVideo.mutate(
      {
        file,
        onProgress: (progress) =>
          setVideoUpload((prev) => ({ ...prev, progress, status: progress < 100 ? 'uploading' : 'processing' })),
      },
      {
        onSuccess: ({ url, publicId }) => {
          setData((prev) => ({ ...prev, promoVideoUrl: url, promoVideoPublicId: publicId }));
          setVideoUpload({ status: 'done', progress: 100, fileName: file.name });
        },
        onError: () => setVideoUpload(idle),
      }
    );
  }

  return { thumbnailUpload, videoUpload, handleThumbnailFile, handleVideoFile };
}
