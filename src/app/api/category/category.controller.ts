import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import authMiddleware from '../../../../middleware/auth.middleware';
import { AppError } from '@/lib/appError';
import { createCategorySchema, updateCategorySchema } from '@/lib/validate/category.schema';
import { NextRequest, NextResponse } from 'next/server';

export async function createCategory(req: Request) {
  await createConnection();
  const response = await authMiddleware(req as NextRequest);
  if (response.status === 401) {
    return response;
  }
  const body = await req.json();
  const { name, description } = createCategorySchema.parse(body);

  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    throw new AppError('Category already exists', 400);
  }

  const newCategory = await Category.create({ name, description });
  return NextResponse.json({ data: newCategory }, { status: 201 });
}

export async function getAllCategory() {
  await createConnection();
  const category = await Category.find();
  return NextResponse.json({
    message: 'Category fetched successfully',
    data: category,
    status: 200,
  });
}

export async function deleteCategory(req: Request, id: string) {
  const response = await authMiddleware(req as NextRequest);
  if (response.status === 401) {
    return response;
  }
  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  return NextResponse.json(
    { message: 'Category deleted successfully' },
    { status: 200 }
  );
}

export async function updateCategory(req: Request, id: string) {
  const response = await authMiddleware(req as NextRequest);
  if (response.status === 401) {
    return response;
  }
  const body = await req.json();
  const data = updateCategorySchema.parse(body);

  const category = await Category.findByIdAndUpdate(id, data, { new: true });
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  return NextResponse.json(
    { message: 'Category updated successfully', data: category },
    { status: 200 }
  );
}

export async function getSingleCategory(id: string) {
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  return NextResponse.json(
    { message: 'Category found successfully', data: category },
    { status: 200 }
  );
}
