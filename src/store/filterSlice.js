import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  startTime: '',
  endTime: '',
  maxTws: '',
  useMockData: true,
  useTimeFilter: false,
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
    setMaxTws: (state, action) => {
      state.maxTws = action.payload;
    },
    setUseMockData: (state, action) => {
      state.useMockData = action.payload;
    },
    setUseTimeFilter: (state, action) => {
      state.useTimeFilter = action.payload;
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
      if (!state.useTimeFilter) {
        state.useTimeFilter = true;
      }
    },
    clearFilter: (state) => {
      state.startTime = '';
      state.endTime = '';
      state.maxTws = '';
      state.useTimeFilter = false;
    },
    resetToDefaults: (state, action) => {
      const { startTime, endTime } = action.payload;
      state.defaultStartTime = startTime;
      state.defaultEndTime = endTime;
    },
  },
});

export const {
  setStartTime,
  setEndTime,
  setMaxTws,
  setUseMockData,
  setUseTimeFilter,
  setDefaultStartTime,
  setDefaultEndTime,
  setTimeFilterFromSummary,
  clearFilter,
  resetToDefaults,
} = filterSlice.actions;

export default filterSlice.reducer;
