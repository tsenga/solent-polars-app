import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import TimeSeriesCharts from './TimeSeriesCharts';

const ParquetDataSummary = ({ 
  displayedParquetData, 
  filteredData = [],
  rawParquetData = [],
  editingWindSpeed 
}) => {
  const totalParquetData = rawParquetData.length;
  const filteredParquetData = filteredData.length;
  
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Parquet Data Summary
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
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
          label={`Displayed (TWS ${editingWindSpeed}): ${displayedParquetData}`}
          color="secondary"
          variant="filled"
        />
      </Box>
      
      {filteredData.length > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <TimeSeriesCharts 
              data={rawParquetData} 
              onSetTimeFilter={(type, timestamp) => {
                // Format timestamp for datetime-local input
                const formattedTime = new Date(timestamp).toISOString().slice(0, 16);
                
                // Call parent component to update the filter
                if (window.setTimeFilter) {
                  window.setTimeFilter(type, formattedTime);
                }
              }}
            />
          </Box>
        </>
      )}
    </Paper>
  );
};

export default ParquetDataSummary;
