import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ICourse, IInitialData } from './type';
import { Status } from '../category/type';
import { AppDispatch } from '../store';
import { API } from '@/http/http';
import { toast } from 'react-toastify';
import { closeModal } from '../modal/modalSlice';
import { Coming_Soon } from 'next/font/google';

const data: IInitialData = {
  courses: [],
  status: Status.LOADING,
};
const courseSlice = createSlice({
  name: 'courses',
  initialState: data,
  reducers: {
    setStatus(state: IInitialData, action: PayloadAction<Status>) {
      state.status = action.payload;
    },
    setCourses(state: IInitialData, action: PayloadAction<IInitialData>) {
      state.courses = action.payload;
    },
    setAddCourse(state: IInitialData, action: PayloadAction<IInitialData>) {
      state.courses.push(action.payload.courses[0]);
    },
    setRemoveCourse(state: IInitialData, action: PayloadAction<string>) {
      const index = state.courses.findIndex(
        (course) => course._id == action.payload
      );
      if (index !== -1) {
        state.courses.splice(index, 1);
      }
    },
    setUpdateCourses: (state, action) => {
      const index = state.courses.findIndex(
        (courses) => courses._id === action.payload._id
      );
      if (index !== -1) {
        state.courses[index] = action.payload;
      }
    },
    setReset(state) {
      state.status = Status.LOADING;
    },
  },
});

export const {
  setAddCourse,
  setCourses,
  setStatus,
  setReset,
  setRemoveCourse,
  setUpdateCourses,
} = courseSlice.actions;
export default courseSlice.reducer;

export function fetchCourses() {
  return async function getAllCoursesThunk(dispatch: AppDispatch) {
    try {
      const response = await API.get('/courses');
      if (response.status === 200) {
        dispatch(setStatus(Status.SUCCESS));
        dispatch(setCourses(response.data.data));
      } else {
        dispatch(setStatus(Status.ERROR));
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      dispatch(setStatus(Status.ERROR));
    }
  };
}

export function createCourse(courseData: {
  title: string;
  description: string;
  price: number;
  category: string;
  duration: string;
}) {
  return async function createCourseThunk(dispatch: AppDispatch) {
    try {
      const response = await API.post('/courses', courseData);
      if (response.status === 201) {
        console.log("aaaaaa",response.data.data);
        dispatch(setStatus(Status.SUCCESS));
        dispatch(setAddCourse(response.data.data));
        toast.success('Course added successfully');
        closeModal();
      }
      if (response.status === 401) {
        dispatch(setStatus(Status.ERROR));
        toast.error('Unauthorized');
      }
    } catch (error) {
      console.log(error);
      dispatch(setStatus(Status.ERROR));
    }
  };
}
export function updateCourse(
  data: {
    title: string;
    description: string;
    price: number;
    category: string;
    duration: string;
  },
  id: string
) {
  return async function updateCourseThunk(dispatch: AppDispatch) {
    try {
      const response = await API.patch(`/courses/${id}`, data);
      if (response.status === 200) {
        dispatch(setUpdateCourses(response.data.data));
        dispatch(setStatus(Status.SUCCESS));
        dispatch(closeModal());

        toast.success('Course updated successfully');
      }
    } catch (error) {
      dispatch(setStatus(Status.ERROR));
      console.log(error.message);
    }
  };
}

export function deleteCourse(id: string) {
  return async function deleteCourseThunk(dispatch: AppDispatch) {
    try {
      const response = await API.delete(`/courses/${id}`);
      if (response.status === 200) {
        dispatch(setRemoveCourse(id));
        dispatch(setStatus(Status.SUCCESS));
        toast.success('Course deleted successfully');
      }
    } catch (error) {
      console.log(error);
      dispatch(setStatus(Status.ERROR));
    }
  };
}
