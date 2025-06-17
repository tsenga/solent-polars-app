import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import DataFilter from './DataFilter';
import ParquetDataSummary from './ParquetDataSummary';

const DataSourceSelection = ({ editingWindSpeed, polarData }) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Data Source Selection
      </Typography>
      <Box sx={{ mt: 2 }}>
        <DataFilter />
        <ParquetDataSummary 
          editingWindSpeed={editingWindSpeed}
          polarData={polarData}
        />
      </Box>
    </Paper>
  );
};

export default DataSourceSelection;
