import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, FormControlLabel, Switch, Checkbox } from '@mui/material';

const DataFilter = ({ onFilterChange, loading }) => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxTws, setMaxTws] = useState('');
  const [useMockData, setUseMockData] = useState(true);
  const [useTimeFilter, setUseTimeFilter] = useState(false);

  // Listen for time filter events from ParquetDataSummary
  React.useEffect(() => {
    const handleSetTimeFilter = (event) => {
      const { type, formattedTime } = event.detail;
      
      if (type === 'start') {
        setStartTime(formattedTime);
      } else if (type === 'end') {
        setEndTime(formattedTime);
      }
      
      // Enable time filter if it's not already enabled
      if (!useTimeFilter) {
        setUseTimeFilter(true);
      }
    };

    window.addEventListener('setTimeFilter', handleSetTimeFilter);
    return () => window.removeEventListener('setTimeFilter', handleSetTimeFilter);
  }, [useTimeFilter]);

  const handleApplyFilter = () => {
    // Check if time filter is enabled but only one time is specified
    if (useTimeFilter && ((startTime && !endTime) || (!startTime && endTime))) {
      alert('Please specify both start and end times when using time filter');
      return;
    }
    
    // Check if start time is before end time when both are specified
    if (useTimeFilter && startTime && endTime && new Date(startTime) >= new Date(endTime)) {
      alert('Start time must be before end time');
      return;
    }

    const filterData = {
      useMockData: useMockData
    };

    // Only add time filters if time filter is enabled and both times are specified
    if (useTimeFilter && startTime && endTime) {
      filterData.startTime = new Date(startTime).toISOString();
      filterData.endTime = new Date(endTime).toISOString();
    }

    // Add max TWS filter if specified
    if (maxTws) {
      filterData.maxTws = parseFloat(maxTws);
    }

    onFilterChange(filterData);
  };

  const handleClearFilter = () => {
    setStartTime('');
    setEndTime('');
    setMaxTws('');
    setUseTimeFilter(false);
    onFilterChange({ useMockData: useMockData });
  };

  const handleToggleDataSource = (event) => {
    const newUseMockData = event.target.checked;
    setUseMockData(newUseMockData);
    
    // Immediately apply the data source change
    const currentFilter = {
      useMockData: newUseMockData
    };
    
    if (useTimeFilter && startTime && endTime) {
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
      
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={useTimeFilter}
              onChange={(e) => setUseTimeFilter(e.target.checked)}
            />
          }
          label="Use time filter"
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
          disabled={!useTimeFilter}
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
          disabled={!useTimeFilter}
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
