import { createConnection } from '@/database/db';
import {
  createCategory,
  deleteCategory,
  getAllCategory,
} from './category.controller';

export async function POST(req: Request) {
  return createCategory(req);
}

export async function GET() {
  await createConnection();
  return getAllCategory();
}
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await createConnection(); // Ensure DB connection
    const { id } = params; // Extract id from dynamic route

    if (!id) {
      return NextResponse.json(
        { message: 'Category ID is required' },
        { status: 400 }
      );
    }

    const response = await deleteCategory
    (id);

    return NextResponse.json(
      { message: 'Category deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Error deleting category', error: error.message },
      { status: 500 }
    );
  }
}
