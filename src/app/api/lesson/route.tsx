import { createLesson, getLesson } from "./lesson.Controller"

export async function GET()
{
    return getLesson();
}

export async function POST(req:Request)
{
    return createLesson(req);
}
