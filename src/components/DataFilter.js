import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';

const DataFilter = ({ onFilterChange, loading }) => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleApplyFilter = () => {
    if (!startTime || !endTime) {
      alert('Please select both start and end times');
      return;
    }
    
    if (new Date(startTime) >= new Date(endTime)) {
      alert('Start time must be before end time');
      return;
    }

    onFilterChange({
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString()
    });
  };

  const handleClearFilter = () => {
    setStartTime('');
    setEndTime('');
    onFilterChange(null);
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Data Filter
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          label="Start Time"
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
          size="small"
        />
        <TextField
          label="End Time"
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
          size="small"
        />
        <Button 
          variant="contained" 
          onClick={handleApplyFilter}
          disabled={loading}
        >
          Apply Filter
        </Button>
        <Button 
          variant="outlined" 
          onClick={handleClearFilter}
          disabled={loading}
        >
          Clear
        </Button>
      </Box>
    </Paper>
  );
};

export default DataFilter;
