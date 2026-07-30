import { configureStore } from '@reduxjs/toolkit'
import categorySlice from './category/categorySlice'
import modalSlice from  './modal/modalSlice'
import courseSlice from './courses/coursesSlice'
import enrollmentsSlice from './enrollments/enrollmentsSlice'
import lessonsSlice from './lessons/lessonsSlice'
import progressSlice from './progress/progressSlice'
import paymentsSlice from './payments/paymentsSlice'

export const makeStore = () => {
  return configureStore({
    reducer: {
      modal:modalSlice,
      categores:categorySlice,
      courses:courseSlice,
      enrollments: enrollmentsSlice,
      lessons: lessonsSlice,
      progress: progressSlice,
      payments: paymentsSlice,
    },
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
