import { createConnection } from '@/database/db';
import Category  from '@/database/models/category';
import authMiddleware from '../../../../middleware/auth.middleware';
import { NextRequest, NextResponse } from 'next/server';
export async function createCategory(req: Request) {
  await createConnection();
  const response = await authMiddleware(req as NextRequest);
  if (response.status === 401) {
    // If unauthorized, return early
    return response;
  }
  const { name, description } = await req.json();
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    return Response.json(
      { message: 'Category already exists' },
      { status: 400 }
    );
  }
  try {
    const newCategory = await Category.create({ name, description });
    return Response.json({ data: newCategory }, { status: 201 });
  } catch (err) {
    console.log(err.messaage);

    return Response.json(
      { message: 'Failed to create category' },
      { status: 300 }
    );
  }
}
export async function getAllCategory() {
  const category = await Category.find();
  if (category.length === 0) {
    return Response.json({ message: 'Category not found' }, { status: 404 });
  }
  try {
    return Response.json({
      message: 'Category fetched successfully',
      data: category,
      status: 200,
    });
  } catch (err) {
    console.log(err);
    return Response.json(
      { message: 'Failed to get category' },
      { status: 500 }
    );
  }
}
export async function deleteCategory(id: string) {
  try {
    console.log('id', id);
    const category = await Category.findByIdAndDelete(id);
    console.log('Deleted category:', category);

    if (!category) {
      return NextResponse.json(
        { message: 'Category not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: 'Category deleted successfully' },
      { status: 200 }
    );
  } catch (err) {
    console.log(err);
    // Return a proper error response
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function updateCategory(
  id: string,
  name: string,
  description: string
) {
  try {
    const category = await Category.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );
    if (!category) {
      return NextResponse.json(
        { message: 'Category not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: 'Category updated successfully', data: category },
      { status: 200 }
    );
  } catch (err) {
    console.log(err);
    // Return a proper error response
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}


export async function getSingleCategory(id:string){
  try{
    const category = await Category.findById(id);
    if(!category){
      return NextResponse.json(
        { message: 'Category not found' },
        { status: 404 }
        );
        }
        return NextResponse.json(
          { message: 'Category found successfully', data: category },
          { status: 200 }
          );
          } catch (err) {
            console.log(err);
            // Return a proper error response
            return NextResponse.json({ message: 'Server error' }, { status: 500 });
            }
  }

