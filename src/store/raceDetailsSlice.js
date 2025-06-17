import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for loading race details from server
export const loadRaceDetails = createAsyncThunk(
  'raceDetails/loadRaceDetails',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/race-details');
      if (!response.ok) {
        throw new Error('Failed to load race details');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for saving race details to server
export const saveRaceDetails = createAsyncThunk(
  'raceDetails/saveRaceDetails',
  async (raceDetails, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/race-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(raceDetails),
      });
      if (!response.ok) {
        throw new Error('Failed to save race details');
      }
      return raceDetails;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  races: [],
  selectedRaceId: null,
  isEditing: false,
  loading: false,
  error: null,
};

const raceDetailsSlice = createSlice({
  name: 'raceDetails',
  initialState,
  reducers: {
    addRace: (state, action) => {
      const newRace = {
        id: Date.now().toString(),
        name: action.payload.name,
        startDateTime: action.payload.startDateTime,
        finishDateTime: action.payload.finishDateTime,
        createdAt: new Date().toISOString(),
      };
      state.races.push(newRace);
      state.selectedRaceId = newRace.id;
    },
    updateRace: (state, action) => {
      const { id, name, startDateTime, finishDateTime } = action.payload;
      const raceIndex = state.races.findIndex(race => race.id === id);
      if (raceIndex !== -1) {
        state.races[raceIndex] = {
          ...state.races[raceIndex],
          name,
          startDateTime,
          finishDateTime,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    deleteRace: (state, action) => {
      const raceId = action.payload;
      state.races = state.races.filter(race => race.id !== raceId);
      if (state.selectedRaceId === raceId) {
        state.selectedRaceId = state.races.length > 0 ? state.races[0].id : null;
      }
    },
    selectRace: (state, action) => {
      state.selectedRaceId = action.payload;
    },
    setIsEditing: (state, action) => {
      state.isEditing = action.payload;
    },
    clearRaces: (state) => {
      state.races = [];
      state.selectedRaceId = null;
      state.isEditing = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadRaceDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadRaceDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.races = action.payload.races || [];
        state.error = null;
        // Select first race if none selected and races exist
        if (!state.selectedRaceId && state.races.length > 0) {
          state.selectedRaceId = state.races[0].id;
        }
      })
      .addCase(loadRaceDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(saveRaceDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveRaceDetails.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(saveRaceDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  addRace,
  updateRace,
  deleteRace,
  selectRace,
  setIsEditing,
  clearRaces,
  clearError,
} = raceDetailsSlice.actions;

// Selectors
export const selectAllRaces = (state) => state.raceDetails.races;
export const selectSelectedRace = (state) => {
  const selectedId = state.raceDetails.selectedRaceId;
  return state.raceDetails.races.find(race => race.id === selectedId) || null;
};
export const selectIsEditing = (state) => state.raceDetails.isEditing;
export const selectLoading = (state) => state.raceDetails.loading;
export const selectError = (state) => state.raceDetails.error;

export default raceDetailsSlice.reducer;
