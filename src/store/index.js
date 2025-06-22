import { configureStore } from '@reduxjs/toolkit';
import filterReducer, { setRaceTimeFilter } from './filterSlice';
import parquetDataReducer, { fetchParquetData, setEditingWindSpeed } from './parquetDataSlice';
import parquetDataSummaryReducer, { fetchParquetDataSummary } from './parquetDataSummarySlice';
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

// Track last fetch parameters to avoid duplicate requests
let lastFetchParams = null;
let lastFetchTime = 0;
const FETCH_DEBOUNCE_MS = 500; // Minimum time between fetches

// Helper function to serialize filter data for comparison
const serializeFilterData = (filterData) => {
  return JSON.stringify({
    startTime: filterData.startTime,
    endTime: filterData.endTime,
    minTws: filterData.minTws,
    maxTws: filterData.maxTws,
    useMockData: filterData.useMockData
  });
};

// Helper function to create wind speed range filter data
const createWindSpeedRangeFilterData = (baseFilterData, windSpeedRange) => {
  return {
    ...baseFilterData,
    minTws: windSpeedRange.minTws === 0 ? '' : windSpeedRange.minTws.toString(),
    maxTws: windSpeedRange.maxTws === Infinity ? '' : windSpeedRange.maxTws.toString()
  };
};

// Middleware to automatically fetch parquet data when filter changes
const autoFetchDataMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // List of filter actions that should trigger data fetch
  const filterActions = [
    'filter/setStartTime',
    'filter/setEndTime',
    'filter/setMinTws',
    'filter/setMaxTws',
    'filter/setUseMockData',
    'filter/setRaceTimeFilter',
    'filter/clearFilter'
  ];
  
  // Check if this action should trigger a data fetch
  if (filterActions.includes(action.type)) {
    const state = store.getState();
    const filterData = state.filter;
    
    // Only fetch if we have meaningful filter data or are using mock data
    if (filterData.useMockData || filterData.startTime || filterData.endTime || filterData.minTws || filterData.maxTws) {
      const currentParams = serializeFilterData(filterData);
      const currentTime = Date.now();
      
      // Check if this is a duplicate request or too soon after last fetch
      if (currentParams !== lastFetchParams && (currentTime - lastFetchTime) > FETCH_DEBOUNCE_MS) {
        console.log('AutoFetchDataMiddleware: Fetching data with params:', filterData);
        lastFetchParams = currentParams;
        lastFetchTime = currentTime;
        
        store.dispatch(fetchParquetData(filterData));
        store.dispatch(fetchParquetDataSummary(filterData));
      } else {
        console.log('AutoFetchDataMiddleware: Skipping duplicate or too-soon fetch');
      }
    }
  }
  
  return result;
};

// Track last wind speed range fetch to avoid duplicates
let lastWindSpeedRangeParams = null;
let lastWindSpeedFetchTime = 0;
let windSpeedChangeTimeout = null;

// Middleware to fetch wind speed range data when editing wind speed changes
const autoFetchWindSpeedRangeMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Check if this is an action that changes the editing wind speed
  if (action.type === setEditingWindSpeed.type) {
    const state = store.getState();
    const { editingWindSpeed, polarData } = action.payload;
    const filterData = state.filter;
    
    console.log('Middleware: setEditingWindSpeed triggered with:', { editingWindSpeed, polarDataLength: polarData?.length });
    
    // Clear any existing timeout to debounce rapid wind speed changes
    if (windSpeedChangeTimeout) {
      clearTimeout(windSpeedChangeTimeout);
    }
    
    // Use requestIdleCallback or setTimeout with 0 delay to avoid blocking UI
    const scheduleWindSpeedFetch = () => {
      // Calculate wind speed range for the editing wind speed
      const windSpeedRange = calculateWindSpeedRange(editingWindSpeed, polarData);
      
      console.log('Middleware: Calculated wind speed range:', windSpeedRange);
      
      // Create filter data with wind speed range
      const rangeFilterData = createWindSpeedRangeFilterData(filterData, windSpeedRange);
      
      // Check for duplicate wind speed range requests
      const currentRangeParams = serializeFilterData(rangeFilterData);
      const currentTime = Date.now();
      
      if (currentRangeParams !== lastWindSpeedRangeParams && (currentTime - lastWindSpeedFetchTime) > FETCH_DEBOUNCE_MS) {
        console.log('Middleware: Fetching parquet data with range filter:', rangeFilterData);
        console.log('Middleware: Wind speed range being applied:', windSpeedRange);
        console.log('Middleware: Using mock data:', rangeFilterData.useMockData);
        lastWindSpeedRangeParams = currentRangeParams;
        lastWindSpeedFetchTime = currentTime;
        
        // Fetch both data and summary for the specific wind speed range
        store.dispatch(fetchParquetData(rangeFilterData));
        store.dispatch(fetchParquetDataSummary(rangeFilterData));
      } else {
        console.log('Middleware: Skipping duplicate wind speed range fetch');
      }
    };

    // Use requestIdleCallback if available, otherwise setTimeout with minimal delay
    if (typeof requestIdleCallback !== 'undefined') {
      windSpeedChangeTimeout = requestIdleCallback(scheduleWindSpeedFetch, { timeout: 100 });
    } else {
      windSpeedChangeTimeout = setTimeout(scheduleWindSpeedFetch, 50); // Reduced to 50ms
    }
  }
  
  return result;
};

// Helper function to calculate wind speed range (same logic as in LinePolarChart)
const calculateWindSpeedRange = (editingWindSpeed, polarData) => {
  if (!editingWindSpeed || !polarData || polarData.length === 0) {
    return { minTws: 0, maxTws: Infinity };
  }

  // Get all wind speeds from polar data and sort them
  const allWindSpeeds = polarData.map(data => data.windSpeed).sort((a, b) => a - b);
  
  // Find the index of the editing wind speed
  const editingIndex = allWindSpeeds.indexOf(editingWindSpeed);
  
  if (editingIndex === -1) {
    // If editing wind speed is not in polar data, return full range
    return { minTws: 0, maxTws: Infinity };
  }

  let minTws, maxTws;

  // Calculate lower bound
  if (editingIndex === 0) {
    // This is the lowest wind speed, so lower bound is 0
    minTws = 0;
  } else {
    // Mid-point between editing wind speed and the next lower wind speed
    const lowerWindSpeed = allWindSpeeds[editingIndex - 1];
    minTws = (lowerWindSpeed + editingWindSpeed) / 2;
  }

  // Calculate upper bound
  if (editingIndex === allWindSpeeds.length - 1) {
    // This is the highest wind speed, so upper bound is infinity
    maxTws = Infinity;
  } else {
    // Mid-point between editing wind speed and the next higher wind speed
    const higherWindSpeed = allWindSpeeds[editingIndex + 1];
    maxTws = (editingWindSpeed + higherWindSpeed) / 2;
  }

  return { minTws, maxTws };
};

export const store = configureStore({
  reducer: {
    filter: filterReducer,
    parquetData: parquetDataReducer,
    parquetDataSummary: parquetDataSummaryReducer,
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
    }).concat(autoSetFilterTimesMiddleware, autoFetchDataMiddleware, autoFetchWindSpeedRangeMiddleware),
});
