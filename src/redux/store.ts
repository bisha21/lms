import { configureStore } from '@reduxjs/toolkit'
import modalSlice from './modal/modalSlice'

// Server-state (courses, categories, enrollments, lessons, payments, progress) now
// lives in TanStack Query — see src/features/*/hooks.ts and src/app/Providers.tsx.
// Redux is kept only for UI-only shared state (the cross-page modal controller).
export const makeStore = () => {
  return configureStore({
    reducer: {
      modal: modalSlice,
    },
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
