import { createConnection } from '@/database/db';
import { ILesson, Lesson } from '@/database/models/lesson';

export async function createLesson(req: Request) {
  try {
    await createConnection();
    const { title, description, videoUrl, course } = await req.json();
    const data = await Lesson.create({
      title,
      description,
      videoUrl,
      course,
    });
    return Response.json(
      {
        message: 'Lesson created!!',
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log(error);
    return Response.json(
      {
        message: 'Something went wrong',
      },
      { status: 500 }
    );
  }
}

export async function getLesson() {
  try {
    await createConnection();
    const data = await Lesson.find().populate('course'); // return array []
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
        message: 'Something went wrong',
      },
      { status: 500 }
    );
  }
}
export async function getLessonById(id: string) {
  try {
    await createConnection();
    const data = await Lesson.findById(id); // returns in object
    if (!data) {
      return Response.json(
        {
          message: 'no course with that id found',
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
        message: 'Something went wrong',
      },
      { status: 500 }
    );
  }
}

export async function deleteLesson(id: string) {
  try {
    await createConnection();
    await Lesson.findByIdAndDelete(id); // returns in object
    return Response.json(
      {
        message: 'lesson deleted!!',
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return Response.json(
      {
        message: 'Something went wrong',
      },
      { status: 500 }
    );
  }
}

export async function updateLesson(id: string, data: ILesson) {
  const { title, description, videoUrl, course } = data;
  try {
    await createConnection();
    const data = await Lesson.findByIdAndUpdate(
      id,
      { title, description, videoUrl, course },
      { new: true }
    ); // returns in object
    return Response.json(
      {
        message: 'lesson updated!!',
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return Response.json(
      {
        message: 'Something went wrong',
      },
      { status: 500 }
    );
  }
}
