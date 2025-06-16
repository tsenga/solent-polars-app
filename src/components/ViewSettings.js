import React, { useState } from 'react';
import { Box, Typography, Paper, FormControlLabel, Checkbox } from '@mui/material';
import WindSpeedSelector from './WindSpeedSelector';

const ViewSettings = ({ 
  windSpeeds, 
  selectedWindSpeeds, 
  onSelectWindSpeed, 
  onAddWindSpeed, 
  onDeleteWindSpeed,
  plotAbsoluteTwa,
  onPlotAbsoluteTwaChange
}) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        View Settings
      </Typography>
      
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
        onAddWindSpeed={onAddWindSpeed}
        onDeleteWindSpeed={onDeleteWindSpeed}
      />
    </Paper>
  );
};

export default ViewSettings;
