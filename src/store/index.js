import { configureStore } from '@reduxjs/toolkit';
import filterReducer, { setRaceTimeFilter } from './filterSlice';
import parquetDataReducer from './parquetDataSlice';
import raceDetailsReducer from './raceDetailsSlice';
import { loadRaceDetails } from './raceDetailsSlice';

// Middleware to automatically set filter times when race details are loaded
const autoSetFilterTimesMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // When race details are successfully loaded, set filter times to first race
  if (action.type === loadRaceDetails.fulfilled.type) {
    const state = store.getState();
    const races = state.raceDetails.races;
    
    // If there are races and no filter times are set, use the first race
    if (races && races.length > 0) {
      const firstRace = races[0];
      const currentFilter = state.filter;
      
      // Only set times if they're not already set or if we're in 'none' mode
      if (currentFilter.timeFilterMode === 'none' || (!currentFilter.startTime && !currentFilter.endTime)) {
        // Convert to datetime-local format for the filter
        const startTime = new Date(firstRace.startDateTime).toISOString().slice(0, 16);
        const endTime = new Date(firstRace.finishDateTime).toISOString().slice(0, 16);
        
        store.dispatch(setRaceTimeFilter({
          startTime,
          endTime
        }));
      }
    }
  }
  
  return result;
};

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
    }).concat(autoSetFilterTimesMiddleware),
});
