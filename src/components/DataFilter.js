import React, { useEffect } from 'react';
import { Box, TextField, Button, Typography, FormControlLabel, Switch, Radio, RadioGroup } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import {
  setStartTime,
  setEndTime,
  setMinTws,
  setMaxTws,
  setUseMockData,
  setTimeFilterMode,
  clearFilter,
  resetToDefaults,
} from '../store/filterSlice';
import RaceSelector from './RaceSelector';

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


  const handleClearFilter = () => {
    dispatch(clearFilter());
  };

  const handleToggleDataSource = (event) => {
    const newUseMockData = event.target.checked;
    dispatch(setUseMockData(newUseMockData));
  };

  return (
    <Box sx={{ mb: 2 }}>      
      {/* Race Selector at the top */}
      <Box sx={{ mb: 2 }}>
        <RaceSelector />
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" gutterBottom>
          Time Filter Mode:
        </Typography>
        <RadioGroup
          value={filter.timeFilterMode}
          onChange={(e) => dispatch(setTimeFilterMode(e.target.value))}
        >
          <FormControlLabel value="race" control={<Radio />} label="Race Selection" />
          <FormControlLabel value="custom" control={<Radio />} label="Custom Time" />
          <FormControlLabel value="none" control={<Radio />} label="No Time Filter" />
        </RadioGroup>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          label="Start Time"
          type="datetime-local"
          value={filter.timeFilterMode !== 'none' ? filter.startTime : filter.defaultStartTime}
          onChange={(e) => dispatch(setStartTime(e.target.value))}
          InputLabelProps={{
            shrink: true,
          }}
          size="small"
          disabled={filter.timeFilterMode === 'none' || filter.timeFilterMode === 'race'}
          placeholder={filter.defaultStartTime}
        />
        <TextField
          label="End Time"
          type="datetime-local"
          value={filter.timeFilterMode !== 'none' ? filter.endTime : filter.defaultEndTime}
          onChange={(e) => dispatch(setEndTime(e.target.value))}
          InputLabelProps={{
            shrink: true,
          }}
          size="small"
          disabled={filter.timeFilterMode === 'none' || filter.timeFilterMode === 'race'}
          placeholder={filter.defaultEndTime}
        />
        <TextField
          label="Min TWS (knots)"
          type="number"
          value={filter.minTws}
          onChange={(e) => dispatch(setMinTws(e.target.value))}
          InputLabelProps={{
            shrink: true,
          }}
          size="small"
          inputProps={{ min: 0, step: 0.1 }}
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
        
      </Box>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mt: 3 }}>
        <Button 
          variant="outlined" 
          onClick={handleClearFilter}
          disabled={loading}
        >
          Clear Filter
        </Button>
      </Box>
      
      {/* Mock Data Selector at the bottom */}
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
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
    </Box>
  );
};

export default DataFilter;
