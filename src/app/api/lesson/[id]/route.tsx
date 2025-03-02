import { deleteLesson, updateLesson } from "../lesson.Controller";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {

    const id=params.id;
    return deleteLesson(id);
}

export async function PATCHASE(req: Request, { params }: { params: { id: string } }) {
    const id=params.id;
    const data= await req.json();

    return updateLesson(id,data);

}