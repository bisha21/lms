import { createSlice } from '@reduxjs/toolkit';
import { ICategory, ICategoryInitalState, Status } from './type';
import { AppDispatch } from '../store';
import axios from 'axios';
import { API } from '@/http/http';

const initialState: ICategoryInitalState = {
  categories: [],
  status: Status.LOADING,
};

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setCategories: (state, action) => {
      state.categories = action.payload;
    },
    setAddCategory: (state, action) => {
      state.categories.push(action.payload);
    },
    setDeleteCategory: (state, action) => {
      state.categories = state.categories.filter(
        (category) => category._id !== action.payload
      );
    },
    setUpdateCategory: (state, action) => {
      const index = state.categories.findIndex(
        (category) => category._id === action.payload._id
      );
      if (index !== -1) {
        state.categories[index] = action.payload;
      }
    },
    setReset: (state) => {
      state.status = Status.LOADING;
    },
  },
});
export const {
  setCategories,
  setStatus,
  setAddCategory,
  setDeleteCategory,
  setUpdateCategory,
} = categoriesSlice.actions;
export default categoriesSlice.reducer;

export function fetchCategories() {
  return async function getAllCategoryThunk(dispatch: AppDispatch) {
    try {
      const response = await API.get('/category');
      if (response.status === 200) {
        dispatch(setStatus(Status.SUCCESS));
        dispatch(setCategories(response.data.data));
      } else {
        dispatch(setStatus(Status.ERROR));
      }
    } catch (error) {
      console.log(error);
      dispatch(setStatus(Status.ERROR));
    }
  };
}
export function createCategory(categoryData: {
  name: string;
  description: string;
}) {
  return async function createCategoryThunk(dispatch: AppDispatch) {
    try {
      const response = await API.post('/category', categoryData);
      if (response.status === 201) {
        dispatch(setStatus(Status.SUCCESS));
        dispatch(setAddCategory(response.data.data));
      }
    } catch (error) {
      console.log(error);
      dispatch(setStatus(Status.ERROR));
    }
  };
}

export function deleteCategory(id: string) {
  return async function deleteCategoryThunk(dispatch: AppDispatch) {
    try {
      const response = await API.delete(`/category/${id}`);
      if (response.status === 200) {
        dispatch(setStatus(Status.SUCCESS));
        dispatch(setDeleteCategory(id));
      }
    } catch (err) {
      console.log(err);
      dispatch(setStatus(Status.ERROR));
    }
  };
}

export function updateCategory(
  id: string,
  data: { name: string; description: string }
) {
  return async function updateCategoryThunk(dispatch: AppDispatch) {
    try {
      const response = await API.patch(`/category/${id}`, data);
      if (response.status === 200) {
        dispatch(setStatus(Status.SUCCESS));
        dispatch(setUpdateCategory(response.data.data));
      }
    } catch (err) {
      console.log(err);
      dispatch(setStatus(Status.ERROR));
    }
  };
}
