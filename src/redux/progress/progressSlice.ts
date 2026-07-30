import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IProgressData, IProgressInitialState } from './type';
import { Status } from '../category/type';
import { AppDispatch } from '../store';
import { API } from '@/http/http';

const initialState: IProgressInitialState = {
  byCourse: {},
  status: Status.LOADING,
};

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<Status>) {
      state.status = action.payload;
    },
    setCourseProgress(
      state,
      action: PayloadAction<{ courseId: string; data: IProgressData }>
    ) {
      state.byCourse[action.payload.courseId] = action.payload.data;
    },
  },
});

export const { setStatus, setCourseProgress } = progressSlice.actions;
export default progressSlice.reducer;

export function fetchProgress(courseId: string) {
  return async function fetchProgressThunk(dispatch: AppDispatch) {
    try {
      const response = await API.get(`/progress/${courseId}`);
      if (response.status === 200) {
        dispatch(setStatus(Status.SUCCESS));
        dispatch(setCourseProgress({ courseId, data: response.data.data }));
      }
    } catch (error) {
      console.log(error);
      dispatch(setStatus(Status.ERROR));
    }
  };
}

// Optimistic: flips the local percentage/completed list before the request
// resolves, and rolls back by re-fetching from the server if it fails.
export function markLessonComplete(courseId: string, lessonId: string) {
  return async function markLessonCompleteThunk(dispatch: AppDispatch, getState: () => { progress: IProgressInitialState }) {
    const current = getState().progress.byCourse[courseId];
    if (current) {
      const alreadyDone = current.completedLessons.includes(lessonId);
      if (!alreadyDone) {
        const completedLessons = [...current.completedLessons, lessonId];
        const percent =
          current.totalLessons === 0
            ? 0
            : Math.round((completedLessons.length / current.totalLessons) * 100);
        dispatch(
          setCourseProgress({
            courseId,
            data: { ...current, completedLessons, percent },
          })
        );
      }
    }

    try {
      await API.patch(`/progress/${courseId}/lessons/${lessonId}`);
    } catch (error) {
      console.log(error);
      dispatch(fetchProgress(courseId));
    }
  };
}
