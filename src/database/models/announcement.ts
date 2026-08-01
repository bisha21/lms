import mongoose, { Schema } from 'mongoose';

export interface IAnnouncement {
  instructor: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  title: string;
  body: string;
  createdAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    instructor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

announcementSchema.index({ instructor: 1, createdAt: -1 });

export const Announcement =
  mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);
