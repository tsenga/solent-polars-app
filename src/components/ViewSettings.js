import React, { useState } from 'react';
import { Box, Typography, Paper, FormControlLabel, Checkbox } from '@mui/material';
import WindSpeedSelector from './WindSpeedSelector';

const ViewSettings = ({ 
  windSpeeds, 
  selectedWindSpeeds, 
  onSelectWindSpeed,
  plotAbsoluteTwa,
  onPlotAbsoluteTwaChange
}) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>      
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={plotAbsoluteTwa}
              onChange={(e) => onPlotAbsoluteTwaChange(e.target.checked)}
            />
          }
          label="Plot absolute TWA"
        />
      </Box>
      
      <WindSpeedSelector 
        windSpeeds={windSpeeds}
        selectedWindSpeeds={selectedWindSpeeds}
        onSelectWindSpeed={onSelectWindSpeed}
      />
    </Paper>
  );
};

export default ViewSettings;
