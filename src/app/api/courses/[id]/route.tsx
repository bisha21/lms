import { createConnection } from "@/database/db";
import { deleteCourse, updateCourse } from "../course.Controller";


export const DELETE = async (req: Request, { params }: { params: { id: string } }) => {
    createConnection();
    const id = params.id;   
    return deleteCourse(id);
}

export const PATCH= async (req: Request, { params }: { params: { id: string } }) => {
    createConnection();
    const data= await req.json();
    const id = params.id;
    return updateCourse(id, data);
}