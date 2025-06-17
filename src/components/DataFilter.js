import React, { useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper, FormControlLabel, Switch, Radio, RadioGroup } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import {
  setStartTime,
  setEndTime,
  setMaxTws,
  setUseMockData,
  setTimeFilterMode,
  setTimeFilterFromSummary,
  clearFilter,
  resetToDefaults,
} from '../store/filterSlice';
import { fetchParquetData, setFilteredData, setDisplayedData } from '../store/parquetDataSlice';

const DataFilter = () => {
  const dispatch = useDispatch();
  const filter = useSelector((state) => state.filter);
  const { rawData: parquetData, loading } = useSelector((state) => state.parquetData);

  // Set default start and end times from parquet data
  useEffect(() => {
    if (parquetData && parquetData.length > 0) {
      // Sort data by timestamp to find first and last
      const sortedData = [...parquetData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const firstTime = new Date(sortedData[0].timestamp).toISOString().slice(0, 16);
      const lastTime = new Date(sortedData[sortedData.length - 1].timestamp).toISOString().slice(0, 16);
      
      console.log(`Start: ${firstTime}, End: ${lastTime}`);
      
      dispatch(resetToDefaults({ startTime: firstTime, endTime: lastTime }));
    }
  }, [parquetData, dispatch]);


  const handleApplyFilter = () => {
    // Check if custom time filter is enabled but only one time is specified
    if (filter.timeFilterMode === 'custom' && ((filter.startTime && !filter.endTime) || (!filter.startTime && filter.endTime))) {
      alert('Please specify both start and end times when using custom time filter');
      return;
    }
    
    // Check if start time is before end time when both are specified
    if ((filter.timeFilterMode === 'custom' || filter.timeFilterMode === 'race') && filter.startTime && filter.endTime && new Date(filter.startTime) >= new Date(filter.endTime)) {
      alert('Start time must be before end time');
      return;
    }

    const filterData = {
      useMockData: filter.useMockData
    };

    // Only add time filters if time filter mode is not 'none' and both times are specified
    if ((filter.timeFilterMode === 'custom' || filter.timeFilterMode === 'race') && filter.startTime && filter.endTime) {
      filterData.startTime = new Date(filter.startTime).toISOString();
      filterData.endTime = new Date(filter.endTime).toISOString();
    }

    // Add max TWS filter if specified
    if (filter.maxTws) {
      filterData.maxTws = parseFloat(filter.maxTws);
    }

    dispatch(fetchParquetData(filterData));
  };

  const handleClearFilter = () => {
    dispatch(clearFilter());
    dispatch(fetchParquetData({ useMockData: filter.useMockData }));
  };

  const handleToggleDataSource = (event) => {
    const newUseMockData = event.target.checked;
    dispatch(setUseMockData(newUseMockData));
    
    // Immediately apply the data source change
    const currentFilter = {
      useMockData: newUseMockData
    };
    
    if ((filter.timeFilterMode === 'custom' || filter.timeFilterMode === 'race') && filter.startTime && filter.endTime) {
      currentFilter.startTime = new Date(filter.startTime).toISOString();
      currentFilter.endTime = new Date(filter.endTime).toISOString();
    }
    
    if (filter.maxTws) {
      currentFilter.maxTws = parseFloat(filter.maxTws);
    }
    
    dispatch(fetchParquetData(currentFilter));
  };

  // Initial load of parquet data
  useEffect(() => {
    dispatch(fetchParquetData({ useMockData: filter.useMockData }));
  }, [dispatch]);

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Filter Settings
      </Typography>
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={filter.useMockData}
              onChange={handleToggleDataSource}
              disabled={loading}
            />
          }
          label={filter.useMockData ? "Using Mock Data" : "Using Real Parquet Data (S3)"}
        />
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" gutterBottom>
          Time Filter Mode:
        </Typography>
        <RadioGroup
          value={filter.timeFilterMode}
          onChange={(e) => dispatch(setTimeFilterMode(e.target.value))}
          row
        >
          <FormControlLabel value="none" control={<Radio />} label="No Time Filter" />
          <FormControlLabel value="race" control={<Radio />} label="Race Selection" />
          <FormControlLabel value="custom" control={<Radio />} label="Custom Time" />
        </RadioGroup>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          label="Start Time"
          type="datetime-local"
          value={filter.timeFilterMode === 'custom' ? filter.startTime : (filter.timeFilterMode === 'race' ? filter.startTime : filter.defaultStartTime)}
          onChange={(e) => dispatch(setStartTime(e.target.value))}
          InputLabelProps={{
            shrink: true,
          }}
          size="small"
          disabled={filter.timeFilterMode === 'none'}
          placeholder={filter.defaultStartTime}
        />
        <TextField
          label="End Time"
          type="datetime-local"
          value={filter.timeFilterMode === 'custom' ? filter.endTime : (filter.timeFilterMode === 'race' ? filter.endTime : filter.defaultEndTime)}
          onChange={(e) => dispatch(setEndTime(e.target.value))}
          InputLabelProps={{
            shrink: true,
          }}
          size="small"
          disabled={filter.timeFilterMode === 'none'}
          placeholder={filter.defaultEndTime}
        />
        <TextField
          label="Max TWS (knots)"
          type="number"
          value={filter.maxTws}
          onChange={(e) => dispatch(setMaxTws(e.target.value))}
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
    </Box>
  );
};

export default DataFilter;
