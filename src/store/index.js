import { configureStore } from '@reduxjs/toolkit';
import filterReducer from './filterSlice';
import parquetDataReducer from './parquetDataSlice';

export const store = configureStore({
  reducer: {
    filter: filterReducer,
    parquetData: parquetDataReducer,
  },
});
