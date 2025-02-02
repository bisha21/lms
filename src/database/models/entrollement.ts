import mongoose, { Schema } from "mongoose"

interface IEntrollment extends Document{
    student: mongoose.Types.ObjectId,
    course: mongoose.Types.ObjectId
    entrolledAt:Date
}

const entrollSchema = new Schema<IEntrollment>({
    student: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: "Course"
    },
    entrolledAt: {
        type: Date,
        default: Date.now
    }
})

export const Entrollment = mongoose.modelNames.Entrollment || mongoose.model('Entrollment',entrollSchema);