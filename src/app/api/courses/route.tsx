import { getAllCourses, creatCourse } from "./course.Controller"

export async function GET(){
     return await getAllCourses()
}

export async function POST(req:Request){
    return await creatCourse(req);
}