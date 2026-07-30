import { createConnection } from "@/database/db"
import { deleteCategory, getSingleCategory, updateCategory } from "../category.controller";

export const DELETE = async (req: Request, { params }: { params: { id: string } }) => {
    createConnection();
    const id = params.id;   
    return deleteCategory(id);
}

export const PATCH= async (req: Request, { params }: { params: { id: string } }) => {
    createConnection();
    const id = params.id;
    const { name, description } = await req.json();
    return updateCategory(id, name, description);
}
export const GET= async (req: Request, { params }: { params: { id: string } }) => {
    createConnection();
    const id = params.id;
    return getSingleCategory(id);
}
