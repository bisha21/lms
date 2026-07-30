import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ILesson, ILessonInitialState } from './type';
import { Status } from '../category/type';
import { AppDispatch } from '../store';
import { API } from '@/http/http';
import { toast } from 'react-toastify';

const initialState: ILessonInitialState = {
  lessons: [],
  status: Status.LOADING,
};

const lessonsSlice = createSlice({
  name: 'lessons',
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<Status>) {
      state.status = action.payload;
    },
    setLessons(state, action: PayloadAction<ILesson[]>) {
      state.lessons = action.payload;
    },
    setAddLesson(state, action: PayloadAction<ILesson>) {
      state.lessons.push(action.payload);
    },
    setUpdateLesson(state, action: PayloadAction<ILesson>) {
      const index = state.lessons.findIndex((lesson) => lesson._id === action.payload._id);
      if (index !== -1) {
        state.lessons[index] = action.payload;
      }
    },
    setRemoveLesson(state, action: PayloadAction<string>) {
      state.lessons = state.lessons.filter((lesson) => lesson._id !== action.payload);
    },
  },
});

export const { setStatus, setLessons, setAddLesson, setUpdateLesson, setRemoveLesson } =
  lessonsSlice.actions;
export default lessonsSlice.reducer;

export function fetchLessons(courseId: string) {
  return async function fetchLessonsThunk(dispatch: AppDispatch) {
    try {
      const response = await API.get(`/courses/${courseId}/lessons`);
      if (response.status === 200) {
        dispatch(setStatus(Status.SUCCESS));
        dispatch(setLessons(response.data.data));
      }
    } catch (error) {
      console.log(error);
      dispatch(setStatus(Status.ERROR));
    }
  };
}

export function createLesson(
  courseId: string,
  data: { title: string; description: string; durationSeconds?: number; video: File }
) {
  return async function createLessonThunk(dispatch: AppDispatch) {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      if (data.durationSeconds) {
        formData.append('durationSeconds', String(data.durationSeconds));
      }
      formData.append('video', data.video);

      const response = await API.post(`/courses/${courseId}/lessons`, formData, {
        headers: { 'Content-Type': undefined },
      });
      if (response.status === 201) {
        dispatch(setAddLesson(response.data.data));
        toast.success('Lesson added successfully');
      }
    } catch (error) {
      console.log(error);
      dispatch(setStatus(Status.ERROR));
      toast.error('Failed to add lesson');
    }
  };
}

export function updateLesson(
  id: string,
  data: Partial<{ title: string; description: string; order: number; durationSeconds: number }>
) {
  return async function updateLessonThunk(dispatch: AppDispatch) {
    try {
      const response = await API.patch(`/lessons/${id}`, data);
      if (response.status === 200) {
        dispatch(setUpdateLesson(response.data.data));
        toast.success('Lesson updated successfully');
      }
    } catch (error) {
      console.log(error);
      dispatch(setStatus(Status.ERROR));
      toast.error('Failed to update lesson');
    }
  };
}

export function reorderLesson(id: string, order: number) {
  return updateLesson(id, { order });
}

export function deleteLesson(id: string) {
  return async function deleteLessonThunk(dispatch: AppDispatch) {
    try {
      const response = await API.delete(`/lessons/${id}`);
      if (response.status === 200) {
        dispatch(setRemoveLesson(id));
        toast.success('Lesson deleted successfully');
      }
    } catch (error) {
      console.log(error);
      dispatch(setStatus(Status.ERROR));
    }
  };
}
