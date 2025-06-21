import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  startTime: '',
  endTime: '',
  minTws: '',
  maxTws: '',
  useMockData: true,
  timeFilterMode: 'race', // 'none', 'race', 'custom'
  defaultStartTime: '',
  defaultEndTime: '',
};

const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setStartTime: (state, action) => {
      state.startTime = action.payload;
    },
    setEndTime: (state, action) => {
      state.endTime = action.payload;
    },
    setMinTws: (state, action) => {
      state.minTws = action.payload;
    },
    setMaxTws: (state, action) => {
      state.maxTws = action.payload;
    },
    setUseMockData: (state, action) => {
      state.useMockData = action.payload;
    },
    setTimeFilterMode: (state, action) => {
      state.timeFilterMode = action.payload;
      // Clear times when switching to 'none'
      if (action.payload === 'none') {
        state.startTime = '';
        state.endTime = '';
      }
    },
    setDefaultStartTime: (state, action) => {
      state.defaultStartTime = action.payload;
    },
    setDefaultEndTime: (state, action) => {
      state.defaultEndTime = action.payload;
    },
    setTimeFilterFromSummary: (state, action) => {
      console.log('setTimeFilterFromSummary');

      const { type, formattedTime } = action.payload;
      if (type === 'start') {
        state.startTime = formattedTime;
        if (!state.endTime) {
          state.endTime = state.defaultEndTime;
        }
      } else if (type === 'end') {
        state.endTime = formattedTime;
        if (!state.startTime) {
          state.startTime = state.defaultStartTime;
        }
      }
      if (state.timeFilterMode === 'none') {
        state.timeFilterMode = 'custom';
      }
    },
    clearFilter: (state) => {
      state.startTime = '';
      state.endTime = '';
      state.minTws = '';
      state.maxTws = '';
      state.timeFilterMode = 'none';
    },
    resetToDefaults: (state, action) => {
      const { startTime, endTime } = action.payload;
      state.defaultStartTime = startTime;
      state.defaultEndTime = endTime;
      // Only set actual times if they're not already set by race selection
      if (!state.startTime && !state.endTime && state.timeFilterMode === 'none') {
        state.startTime = startTime;
        state.endTime = endTime;
      }
    },
    setRaceTimeFilter: (state, action) => {
      const { startTime, endTime } = action.payload;
      state.startTime = startTime;
      state.endTime = endTime;
      state.timeFilterMode = 'race';
    },
  },
});

export const {
  setStartTime,
  setEndTime,
  setMinTws,
  setMaxTws,
  setUseMockData,
  setTimeFilterMode,
  setDefaultStartTime,
  setDefaultEndTime,
  setTimeFilterFromSummary,
  clearFilter,
  resetToDefaults,
  setRaceTimeFilter,
} = filterSlice.actions;

export default filterSlice.reducer;
