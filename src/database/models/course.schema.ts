import mongoose from "mongoose";
const Schema = mongoose.Schema;
const courseSchema= new Schema({
    courseName:String,
    courseDescription:{
        type:String,
    },
    coursePrice:{
        type:Number,
    },
    


})

export const Course= mongoose.model("Course",courseSchema);