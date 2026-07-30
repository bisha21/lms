import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ICourse, ICourseForData, IInitialData } from './type';
import { Status } from '../category/type';
import { AppDispatch } from '../store';
import { API } from '@/http/http';
import { toast } from 'react-toastify';
import { closeModal } from '../modal/modalSlice';

const initialState: IInitialData = {
  courses: [],
  status: Status.LOADING,
};
const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<Status>) {
      state.status = action.payload;
    },
    setCourses(state, action: PayloadAction<ICourse[]>) {
      state.courses = action.payload;
    },
    setMeta(state, action: PayloadAction<IInitialData['meta']>) {
      state.meta = action.payload;
    },
    setAddCourse(state, action: PayloadAction<ICourse>) {
      state.courses.push(action.payload);
    },
    setRemoveCourse(state, action: PayloadAction<string>) {
      const index = state.courses.findIndex((course) => course._id === action.payload);
      if (index !== -1) {
        state.courses.splice(index, 1);
      }
    },
    setUpdateCourses(state, action: PayloadAction<ICourse>) {
      const index = state.courses.findIndex((course) => course._id === action.payload._id);
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
  setMeta,
  setStatus,
  setReset,
  setRemoveCourse,
  setUpdateCourses,
} = courseSlice.actions;
export default courseSlice.reducer;

export function fetchCourses(params?: { page?: number; limit?: number; category?: string; search?: string }) {
  return async function getAllCoursesThunk(dispatch: AppDispatch) {
    try {
      const response = await API.get('/courses', { params });
      if (response.status === 200) {
        dispatch(setStatus(Status.SUCCESS));
        dispatch(setCourses(response.data.data));
        dispatch(setMeta(response.data.meta));
      } else {
        dispatch(setStatus(Status.ERROR));
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      dispatch(setStatus(Status.ERROR));
    }
  };
}

export function createCourse(courseData: ICourseForData) {
  return async function createCourseThunk(dispatch: AppDispatch) {
    try {
      const response = await API.post('/courses', courseData);
      if (response.status === 201) {
        dispatch(setStatus(Status.SUCCESS));
        dispatch(setAddCourse(response.data.data));
        toast.success('Course added successfully');
        dispatch(closeModal());
      }
    } catch (error) {
      console.log(error);
      dispatch(setStatus(Status.ERROR));
      toast.error('Failed to add course');
    }
  };
}

export function updateCourse(data: Partial<ICourseForData>, id: string) {
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
      console.log(error);
      toast.error('Failed to update course');
    }
  };
}

export function togglePublishCourse(id: string, status: 'draft' | 'published') {
  return updateCourse({ status }, id);
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
