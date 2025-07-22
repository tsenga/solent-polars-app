import { createSlice } from '@reduxjs/toolkit';

// Sample initial data with anchor points
const initialPolarData = [
  { windSpeed: 5, anchorPoints: [
    { angle: 0, boatSpeed: 0 },
    { angle: 45, boatSpeed: 2.5 },
    { angle: 90, boatSpeed: 3.8 },
    { angle: 135, boatSpeed: 3.2 },
    { angle: 180, boatSpeed: 2.0 }
  ]},
  { windSpeed: 10, anchorPoints: [
    { angle: 0, boatSpeed: 0 },
    { angle: 45, boatSpeed: 4.2 },
    { angle: 90, boatSpeed: 6.1 },
    { angle: 135, boatSpeed: 5.0 },
    { angle: 180, boatSpeed: 3.5 }
  ]},
  { windSpeed: 15, anchorPoints: [
    { angle: 0, boatSpeed: 0 },
    { angle: 45, boatSpeed: 5.8 },
    { angle: 90, boatSpeed: 7.5 },
    { angle: 135, boatSpeed: 6.3 },
    { angle: 180, boatSpeed: 4.2 }
  ]}
];

const initialState = {
  polarData: initialPolarData,
  selectedWindSpeeds: [10],
};

const polarDataSlice = createSlice({
  name: 'polarData',
  initialState,
  reducers: {
    setPolarData: (state, action) => {
      state.polarData = action.payload;
    },
    setSelectedWindSpeeds: (state, action) => {
      state.selectedWindSpeeds = action.payload;
    },
    updateBoatSpeed: (state, action) => {
      const { windSpeed, angle, newSpeed } = action.payload;
      const windData = state.polarData.find(data => data.windSpeed === windSpeed);
      if (windData) {
        // Find if this angle is already an anchor point
        const existingAnchorIndex = windData.anchorPoints.findIndex(p => p.angle === angle);
        
        if (existingAnchorIndex >= 0) {
          // Update existing anchor point
          windData.anchorPoints[existingAnchorIndex].boatSpeed = parseFloat(newSpeed);
        } else {
          // Add a new anchor point
          windData.anchorPoints.push({ angle, boatSpeed: parseFloat(newSpeed) });
          windData.anchorPoints.sort((a, b) => a.angle - b.angle);
        }
      }
    },
    addAngleEntry: (state, action) => {
      const { editingWindSpeed, newAngle, newSpeed, interpolateBoatSpeed } = action.payload;
      
      state.polarData.forEach(windData => {
        // Check if angle already exists in this wind speed data
        const angleExists = windData.anchorPoints.some(a => a.angle === newAngle);
        if (angleExists) return;
        
        if (windData.windSpeed === editingWindSpeed) {
          // For the wind speed being edited, use the provided boat speed
          windData.anchorPoints.push({ 
            angle: newAngle, 
            boatSpeed: parseFloat(newSpeed) 
          });
        } else {
          // For other wind speeds, interpolate the boat speed
          const interpolatedSpeed = interpolateBoatSpeed(windData.anchorPoints, newAngle);
          windData.anchorPoints.push({ 
            angle: newAngle, 
            boatSpeed: interpolatedSpeed
          });
        }
        windData.anchorPoints.sort((a, b) => a.angle - b.angle);
      });
    },
    deleteAngleEntry: (state, action) => {
      const { editingWindSpeed, angle } = action.payload;
      const windData = state.polarData.find(data => data.windSpeed === editingWindSpeed);
      if (windData) {
        windData.anchorPoints = windData.anchorPoints.filter(a => a.angle !== angle);
      }
    },
    addWindSpeed: (state, action) => {
      const { newWindSpeed } = action.payload;
      
      // Check if wind speed already exists
      if (state.polarData.some(data => data.windSpeed === newWindSpeed)) {
        return; // Don't add duplicate
      }
      
      // Add new wind speed with default anchor points
      state.polarData.push({
        windSpeed: newWindSpeed,
        anchorPoints: [
          { angle: 0, boatSpeed: 0 },
          { angle: 45, boatSpeed: 0 },
          { angle: 90, boatSpeed: 0 },
          { angle: 135, boatSpeed: 0 },
          { angle: 180, boatSpeed: 0 }
        ]
      });
      
      // Sort by wind speed
      state.polarData.sort((a, b) => a.windSpeed - b.windSpeed);
      
      // Add to selected wind speeds
      state.selectedWindSpeeds.push(newWindSpeed);
    },
    deleteWindSpeed: (state, action) => {
      const { windSpeed } = action.payload;
      
      if (state.polarData.length <= 1) {
        return; // Don't delete the last wind speed entry
      }
      
      // Remove from polar data
      state.polarData = state.polarData.filter(data => data.windSpeed !== windSpeed);
      
      // Remove from selected wind speeds
      state.selectedWindSpeeds = state.selectedWindSpeeds.filter(speed => speed !== windSpeed);
      
      // If we removed all selections, select the first available wind speed
      if (state.selectedWindSpeeds.length === 0 && state.polarData.length > 0) {
        state.selectedWindSpeeds = [state.polarData[0].windSpeed];
      }
    },
    updateAnchorPoint: (state, action) => {
      const { windSpeed, oldAngle, newAngle, newSpeed } = action.payload;
      const windData = state.polarData.find(data => data.windSpeed === windSpeed);
      if (windData) {
        // Find the anchor point with the old angle
        const anchorPointIndex = windData.anchorPoints.findIndex(point => 
          Math.abs(point.angle - oldAngle) < 0.1
        );
        if (anchorPointIndex !== -1) {
          // Update the anchor point
          windData.anchorPoints[anchorPointIndex] = {
            angle: newAngle,
            boatSpeed: newSpeed
          };
          // Re-sort anchor points by angle
          windData.anchorPoints.sort((a, b) => a.angle - b.angle);
        }
      }
    },
  },
});

export const {
  setPolarData,
  setSelectedWindSpeeds,
  updateBoatSpeed,
  addAngleEntry,
  deleteAngleEntry,
  addWindSpeed,
  deleteWindSpeed,
  updateAnchorPoint,
} = polarDataSlice.actions;

// Selectors
export const selectPolarData = (state) => state.polarData.polarData;
export const selectSelectedWindSpeeds = (state) => state.polarData.selectedWindSpeeds;

export default polarDataSlice.reducer;
