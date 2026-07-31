export type LessonContentTypeValue = 'video' | 'pdf';

// The trimmed sidebar/navigation projection returned by GET /api/courses/:id/lessons —
// no videoUrl/pdfUrl/description. See ILessonContent for the full-content shape.
export interface ILesson {
  _id: string;
  course: string;
  title: string;
  contentType: LessonContentTypeValue;
  order: number;
  durationSeconds?: number;
  createdAt: string;
}

// The full shape returned by GET /api/lessons/:id — the sole source of playable content.
export interface ILessonContent extends ILesson {
  description: string;
  videoUrl?: string;
  pdfUrl?: string;
}
