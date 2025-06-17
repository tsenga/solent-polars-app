import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  races: [],
  selectedRaceId: null,
  isEditing: false,
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
  },
});

export const {
  addRace,
  updateRace,
  deleteRace,
  selectRace,
  setIsEditing,
  clearRaces,
} = raceDetailsSlice.actions;

// Selectors
export const selectAllRaces = (state) => state.raceDetails.races;
export const selectSelectedRace = (state) => {
  const selectedId = state.raceDetails.selectedRaceId;
  return state.raceDetails.races.find(race => race.id === selectedId) || null;
};
export const selectIsEditing = (state) => state.raceDetails.isEditing;

export default raceDetailsSlice.reducer;
