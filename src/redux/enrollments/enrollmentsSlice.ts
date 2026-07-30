import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IEnrollment, IEnrollmentInitialState } from './type';
import { Status } from '../category/type';
import { AppDispatch } from '../store';
import { API } from '@/http/http';
import { toast } from 'react-toastify';

const initialState: IEnrollmentInitialState = {
  enrollments: [],
  status: Status.LOADING,
};

const enrollmentsSlice = createSlice({
  name: 'enrollments',
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<Status>) {
      state.status = action.payload;
    },
    setEnrollments(state, action: PayloadAction<IEnrollment[]>) {
      state.enrollments = action.payload;
    },
    setAddEnrollment(state, action: PayloadAction<IEnrollment>) {
      state.enrollments.push(action.payload);
    },
  },
});

export const { setStatus, setEnrollments, setAddEnrollment } = enrollmentsSlice.actions;
export default enrollmentsSlice.reducer;

export function fetchMyEnrollments() {
  return async function fetchMyEnrollmentsThunk(dispatch: AppDispatch) {
    try {
      const response = await API.get('/enrollments/me');
      if (response.status === 200) {
        dispatch(setStatus(Status.SUCCESS));
        dispatch(setEnrollments(response.data.data));
      }
    } catch (error) {
      console.log(error);
      dispatch(setStatus(Status.ERROR));
    }
  };
}

export function enrollInCourse(courseId: string) {
  return async function enrollInCourseThunk(dispatch: AppDispatch) {
    try {
      const response = await API.post('/enrollments', { courseId });
      if (response.status === 201 || response.status === 200) {
        dispatch(setAddEnrollment(response.data.data));
        toast.success('Enrolled successfully');
      }
      return response;
    } catch (error) {
      console.log(error);
      toast.error('Failed to enroll');
      throw error;
    }
  };
}
