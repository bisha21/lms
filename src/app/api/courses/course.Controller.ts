import { createConnection } from '@/database/db';
import Course from '@/database/models/course.schema';
import { Lesson } from '@/database/models/lesson';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import Category from '@/database/models/category';

export async function creatCourse(req: Request) {
  createConnection();
  const { title, courseDescription, coursePrice, duration, category } =
    await req.json();
  if (!title || !courseDescription || !coursePrice || !duration || !category) {
    return NextResponse.json(
      { message: 'All fields are required' },
      { status: 400 }
    );
  }
  const existingCourse = await Course.findOne({ title });
  if (existingCourse) {
    return NextResponse.json(
      { message: 'Course already exists' },
      { status: 400 }
    );
  }
  try {
    const newCourse = await Course.create({
      title,
      courseDescription,
      coursePrice,
      duration,
      category,
    });
    return NextResponse.json({ data: newCourse }, { status: 201 });
  } catch (error) {
    console.log(error);
  }
}

export const getAllCourses = async () => {
  try {
    await createConnection();
    console.log(mongoose.models.Category, 'MMC');
    const data = await Course.find().populate('category');

    if (data.length === 0) {
      return Response.json(
        {
          message: 'no course found',
        },
        { status: 404 }
      );
    }
    return Response.json(
      {
        message: 'courses fetched!!',
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return Response.json(
      {
        message: 'Something went wrong mm',
      },
      { status: 500 }
    );
  }
};

export const getCourseById = async (id: string) => {
  try {
    const course = await Course.findById(id).populate('category');
    if (!course) {
      return NextResponse.json({ message: 'No course found' });
    }
    return NextResponse.json({ data: course }, { status: 200 });
  } catch (error) {
    console.log('Something went wrong', error.message);
    return Response.json(
      {
        message: 'Something went wrong',
      },
      { status: 500 }
    );
  }
};

export const deleteCourse = async (id: string) => {
  try {
    createConnection();
    await Course.findByIdAndDelete(id);
    await Lesson.deleteMany({ course: id });
    return NextResponse.json(
      { message: 'Course deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.log('Something went wrong', error.message);
    return Response.json(
      {
        message: 'Something went wrong',
      },
      { status: 500 }
    );
  }
};

export const updateCourse = async (id: string, data) => {
  try {
    createConnection();
    const course = await Course.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );
    return NextResponse.json({ data: course }, { status: 200 });
  } catch (error) {
    console.log('Something went wrong', error.message);
    return Response.json({ message: 'Something went wrong' }, { status: 500 });
  }
};
