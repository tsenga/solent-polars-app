import React from 'react';
import './WindSpeedSelector.css';
import { 
  Box, Typography, Paper, Chip
} from '@mui/material';

const WindSpeedSelector = ({ 
  windSpeeds, 
  selectedWindSpeeds, 
  onSelectWindSpeed
}) => {

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom align="center">
        Wind Speed
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
        {windSpeeds.map(speed => (
          <Chip
            key={speed}
            label={`${speed} knots`}
            onClick={() => {
              // Toggle selection
              if (selectedWindSpeeds.includes(speed)) {
                // Don't allow deselecting the last wind speed
                if (selectedWindSpeeds.length > 1) {
                  onSelectWindSpeed(selectedWindSpeeds.filter(s => s !== speed));
                }
              } else {
                onSelectWindSpeed([...selectedWindSpeeds, speed]);
              }
            }}
            color={selectedWindSpeeds.includes(speed) ? "primary" : "default"}
            variant={selectedWindSpeeds.includes(speed) ? "filled" : "outlined"}
            sx={{ m: 0.5 }}
          />
        ))}
      </Box>
    </Paper>
  );
};

export default WindSpeedSelector;
