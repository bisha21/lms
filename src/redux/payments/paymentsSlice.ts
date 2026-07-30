import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IPayment, IPaymentInitialState } from './type';
import { Status } from '../category/type';
import { AppDispatch } from '../store';
import { API } from '@/http/http';
import { toast } from 'react-toastify';

const initialState: IPaymentInitialState = {
  payments: [],
  status: Status.LOADING,
};

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<Status>) {
      state.status = action.payload;
    },
    setPayments(state, action: PayloadAction<IPayment[]>) {
      state.payments = action.payload;
    },
  },
});

export const { setStatus, setPayments } = paymentsSlice.actions;
export default paymentsSlice.reducer;

export function fetchMyPayments() {
  return async function fetchMyPaymentsThunk(dispatch: AppDispatch) {
    try {
      const response = await API.get('/payments/me');
      if (response.status === 200) {
        dispatch(setStatus(Status.SUCCESS));
        dispatch(setPayments(response.data.data));
      }
    } catch (error) {
      console.log(error);
      dispatch(setStatus(Status.ERROR));
    }
  };
}

export function checkoutCourse(courseId: string) {
  return async function checkoutCourseThunk() {
    try {
      const response = await API.post('/payments/checkout', { courseId });
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.log(error);
      toast.error('Could not start checkout');
    }
  };
}
