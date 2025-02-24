import { configureStore } from '@reduxjs/toolkit'
import categorySlice from './category/categorySlice'
import modalSlice from  './modal/modalSlice'

export const makeStore = () => {
  return configureStore({
    reducer: {
      modal:modalSlice,
      categores:categorySlice
    },
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']