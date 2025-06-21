import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for fetching parquet data summary
export const fetchParquetDataSummary = createAsyncThunk(
  'parquetDataSummary/fetchParquetDataSummary',
  async (filterData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/parquet-data-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filterData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch parquet data summary');
      }

      const result = await response.json();
      return result.summary;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  summary: null,
  loading: false,
  error: null,
};

const parquetDataSummarySlice = createSlice({
  name: 'parquetDataSummary',
  initialState,
  reducers: {
    clearSummary: (state) => {
      state.summary = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchParquetDataSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParquetDataSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
        state.error = null;
      })
      .addCase(fetchParquetDataSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSummary, clearError } = parquetDataSummarySlice.actions;

export default parquetDataSummarySlice.reducer;
