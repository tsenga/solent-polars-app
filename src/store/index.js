import { configureStore } from '@reduxjs/toolkit';
import filterReducer from './filterSlice';
import parquetDataReducer from './parquetDataSlice';

export const store = configureStore({
  reducer: {
    filter: filterReducer,
    parquetData: parquetDataReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
