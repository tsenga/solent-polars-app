import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import DataFilter from './DataFilter';
import ParquetDataSummary from './ParquetDataSummary';
import RaceSelector from './RaceSelector';

const DataSourceSelection = ({ editingWindSpeed, polarData }) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ mt: 2 }}>
        <RaceSelector />
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
