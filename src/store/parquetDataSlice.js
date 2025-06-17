import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for fetching parquet data
export const fetchParquetData = createAsyncThunk(
  'parquetData/fetchParquetData',
  async (filterData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/parquet-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filterData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch parquet data');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  rawData: [],
  filteredData: [],
  displayedData: [],
  loading: false,
  error: null,
};

const parquetDataSlice = createSlice({
  name: 'parquetData',
  initialState,
  reducers: {
    setFilteredData: (state, action) => {
      state.filteredData = action.payload;
    },
    setDisplayedData: (state, action) => {
      state.displayedData = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchParquetData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParquetData.fulfilled, (state, action) => {
        state.loading = false;
        state.rawData = action.payload;
        state.error = null;
      })
      .addCase(fetchParquetData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilteredData, setDisplayedData, clearError } = parquetDataSlice.actions;

export default parquetDataSlice.reducer;
