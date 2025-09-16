import React, { useState } from 'react';
import { Box, Typography, Paper, FormControlLabel, Checkbox, Button } from '@mui/material';
import WindSpeedSelector from './WindSpeedSelector';

const ViewSettings = ({ 
  windSpeeds, 
  selectedWindSpeeds, 
  onSelectWindSpeed,
  plotAbsoluteTwa,
  onPlotAbsoluteTwaChange,
  onDownloadPolarFile
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: 1,
      width: 'fit-content',
      minWidth: 'fit-content'
    }}>
      <Typography variant="subtitle2" sx={{ fontSize: '0.875rem', fontWeight: 600, mb: 0.5 }}>
        View Settings
      </Typography>
      
      <FormControlLabel
        control={
          <Checkbox
            checked={plotAbsoluteTwa}
            onChange={(e) => onPlotAbsoluteTwaChange(e.target.checked)}
            size="small"
          />
        }
        label="Plot absolute TWA"
        sx={{ 
          mb: 1,
          '& .MuiFormControlLabel-label': {
            fontSize: '0.75rem'
          }
        }}
      />
      
      <Button 
        variant="contained"
        color="success"
        onClick={onDownloadPolarFile}
        size="small"
        sx={{ mt: 1, width: 'fit-content' }}
      >
        Download
      </Button>
    </Box>
  );
};

export default ViewSettings;
