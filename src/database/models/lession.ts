import mongoose, { Schema } from "mongoose";

interface ILession extends Document{
    course: mongoose.Types.ObjectId;
    title: string;
    description: string;
    videoUrl: string;
    createdAt:Date
}
const lessionSchema = new Schema<ILession>({
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
export const Lession = mongoose.models.Lession || mongoose.model('Lession',lessionSchema);