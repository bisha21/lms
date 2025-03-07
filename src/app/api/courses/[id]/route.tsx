import { createConnection } from '@/database/db';
import { deleteCourse, getCourseById, updateCourse } from '../course.Controller';

export const DELETE = async (
  req: Request,
  { params }: { params: { id: string } }
) => {
  createConnection();
  const { id } = params; // No need to await params.id, it's synchronous
  return deleteCourse(id);
};

export const PATCH = async (
  req: Request,
  { params }: { params: { id: string } }
) => {
  createConnection();
  const data = await req.json();
  const { id } = params; // No need to await params.id, it's synchronous
  return updateCourse(id, data);
};

export const GET = async (
  req: Request,
  { params }: { params: { id: string } }
) => {
  createConnection();
  const { id } = params; // No need to await params.id, it's synchronous
  return getCourseById(id);
};
