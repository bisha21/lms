import mongoose from "mongoose";
import { unique } from "next/dist/build/utils";
interface Course extends Document{
    title: string;
    courseDescription: string;
    coursePrice: number;
    duration:string;
    categoryId: mongoose.Types.ObjectId;
    lessonId: mongoose.Types.ObjectId[];
    createdAt:Date;
}
const Schema = mongoose.Schema;
const courseSchema= new Schema({
    title:{
        type:String,
        required:true,
        unique:true
    },
    courseDescription:{
        type:String,
        required:true
    },
    coursePrice:{
        type:Number,
    },
    duration:{
        type:String,
        required:true
    },
    categoryId:{
        type:Schema.Types.ObjectId,
        ref:"Category"
    },
    lessonId:[{
        type:Schema.Types.ObjectId,
        ref:"Lesson"
    }],
    createdAt : {
        type : Date, 
        default : Date.now()
    }


})

export const Course= mongoose.models.Course || mongoose.model("Course",courseSchema);