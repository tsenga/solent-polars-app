import { configureStore } from '@reduxjs/toolkit';
import filterReducer from './filterSlice';
import parquetDataReducer from './parquetDataSlice';
import raceDetailsReducer from './raceDetailsSlice';

export const store = configureStore({
  reducer: {
    filter: filterReducer,
    parquetData: parquetDataReducer,
    raceDetails: raceDetailsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Disable serializable check for parquet data actions since they contain large arrays
        ignoredActions: ['parquetData/fetchParquetData/fulfilled'],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['payload.data'],
        // Ignore these paths in the state
        ignoredPaths: ['parquetData.rawData', 'parquetData.filteredData', 'parquetData.displayedData'],
      },
      immutableCheck: {
        ignoredPaths: ['parquetData.rawData', 'parquetData.filteredData', 'parquetData.displayedData']
      }
    }),
});
