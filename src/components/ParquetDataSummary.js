import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';

const ParquetDataSummary = ({ 
  totalParquetData, 
  filteredParquetData, 
  displayedParquetData, 
  editingWindSpeed 
}) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Parquet Data Summary
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
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
    </Paper>
  );
};

export default ParquetDataSummary;
