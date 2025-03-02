import mongoose, { Schema } from "mongoose";

 export interface ILesson extends Document{
    course: mongoose.Types.ObjectId;
    title: string;
    description: string;
    videoUrl: string;
    createdAt:Date
}
const lessonSchema = new Schema<ILesson>({
    course: {
        type: Schema.Types.ObjectId,
        ref: "Course",
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    videoUrl: {
        type: String,
        required: true,
    },
    createdAt : {
        type : Date, 
        default : Date.now()
    }
})
export const Lesson = mongoose.models.Lesson || mongoose.model('Lesson',lessonSchema);