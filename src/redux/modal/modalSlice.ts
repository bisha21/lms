import { createSlice } from "@reduxjs/toolkit";

const modalSlice = createSlice({
  name: "modal",
  initialState: {
    isOpen: false,
  },
  reducers: {
    openModal: (state) => {
      state.isOpen = true;
    },
    closeModal: (state) => {
      state.isOpen = false;
    },
    setIsOpen: (state, action) => {
      state.isOpen = action.payload;
    },
  },
});

export const { openModal, closeModal, setIsOpen } = modalSlice.actions;
export default modalSlice.reducer;
