import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, FormControlLabel, Switch } from '@mui/material';

const DataFilter = ({ onFilterChange, loading }) => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxTws, setMaxTws] = useState('');
  const [useMockData, setUseMockData] = useState(true);

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
      endTime: new Date(endTime).toISOString(),
      maxTws: maxTws ? parseFloat(maxTws) : undefined,
      useMockData: useMockData
    });
  };

  const handleClearFilter = () => {
    setStartTime('');
    setEndTime('');
    setMaxTws('');
    onFilterChange({ useMockData: useMockData });
  };

  const handleToggleDataSource = (event) => {
    const newUseMockData = event.target.checked;
    setUseMockData(newUseMockData);
    
    // Immediately apply the data source change
    const currentFilter = {
      useMockData: newUseMockData
    };
    
    if (startTime && endTime) {
      currentFilter.startTime = new Date(startTime).toISOString();
      currentFilter.endTime = new Date(endTime).toISOString();
    }
    
    if (maxTws) {
      currentFilter.maxTws = parseFloat(maxTws);
    }
    
    onFilterChange(currentFilter);
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Data Filter
      </Typography>
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={useMockData}
              onChange={handleToggleDataSource}
              disabled={loading}
            />
          }
          label={useMockData ? "Using Mock Data" : "Using Real Parquet Data (S3)"}
        />
      </Box>
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
        <TextField
          label="Max TWS (knots)"
          type="number"
          value={maxTws}
          onChange={(e) => setMaxTws(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
          size="small"
          inputProps={{ min: 0, step: 0.1 }}
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
