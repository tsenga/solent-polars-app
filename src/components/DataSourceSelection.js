import React from 'react';
import { Paper, Typography, Box, Grid } from '@mui/material';
import DataFilter from './DataFilter';
import ParquetDataSummary from './ParquetDataSummary';
import RaceSelector from './RaceSelector';

const DataSourceSelection = ({ editingWindSpeed, polarData }) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={3}>
        {/* Left Column - Filters */}
        <Grid item xs={12} md={4}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Data Filters
            </Typography>
            <DataFilter />
          </Box>
        </Grid>
        
        {/* Right Column - Charts and Summary */}
        <Grid item xs={12} md={8}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Data Summary & Charts
            </Typography>
            <ParquetDataSummary 
              editingWindSpeed={editingWindSpeed}
              polarData={polarData}
            />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default DataSourceSelection;
