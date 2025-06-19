import React, { useEffect } from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { setFilteredData, setDisplayedData } from '../store/parquetDataSlice';
import { setTimeFilterFromSummary } from '../store/filterSlice';
import TimeSeriesCharts from './TimeSeriesCharts';

const ParquetDataSummary = ({ editingWindSpeed, polarData }) => {
  const dispatch = useDispatch();
  const { rawData, filteredData, displayedData } = useSelector((state) => state.parquetData);
  
  const totalParquetData = rawData.length;
  const filteredParquetData = filteredData.length;
  const displayedParquetDataCount = displayedData.length;

  
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Data Summary
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap', mb: 2 }}>
        <Chip 
          label={`Total Points: ${totalParquetData}`}
          color="default"
          variant="outlined"
        />
        <Chip 
          label={`Filtered Points: ${filteredParquetData}`}
          color="primary"
          variant="outlined"
        />
        <Chip 
          label={`Displayed (TWS ${editingWindSpeed}): ${displayedParquetDataCount}`}
          color="secondary"
          variant="filled"
        />
      </Box>
      
      {filteredData.length > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3 }}>
            <TimeSeriesCharts 
              data={rawData} 
              onSetTimeFilter={(type, timestamp) => {
                // Format timestamp for datetime-local input
                const formattedTime = new Date(timestamp).toISOString().slice(0, 16);
                
                // Dispatch Redux action to update the filter
                dispatch(setTimeFilterFromSummary({ type, formattedTime }));
              }}
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default ParquetDataSummary;
