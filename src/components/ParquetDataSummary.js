import React from 'react';
import { Box, Typography, Paper, Chip, Grid } from '@mui/material';

const ParquetDataSummary = ({ 
  totalParquetData, 
  filteredParquetData, 
  displayedParquetData, 
  filteredData = [],
  editingWindSpeed 
}) => {
  
  // Create histogram data for TWS, TWA, and BSP
  const createHistogram = (data, key, bins = 10) => {
    if (!data || data.length === 0) return [];
    
    const values = data.map(d => d[key]).filter(v => v != null);
    if (values.length === 0) return [];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / bins;
    
    const histogram = Array(bins).fill(0).map((_, i) => ({
      bin: min + i * binWidth,
      binEnd: min + (i + 1) * binWidth,
      count: 0,
      label: `${(min + i * binWidth).toFixed(1)}-${(min + (i + 1) * binWidth).toFixed(1)}`
    }));
    
    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
      histogram[binIndex].count++;
    });
    
    return histogram;
  };
  
  const twsHistogram = createHistogram(filteredData, 'tws', 8);
  const twaHistogram = createHistogram(filteredData, 'twa', 10);
  const bspHistogram = createHistogram(filteredData, 'bsp', 8);
  
  // Simple SVG histogram component
  const SimpleHistogram = ({ data, title, color = '#1976d2' }) => {
    if (!data || data.length === 0) return null;
    
    const maxCount = Math.max(...data.map(d => d.count));
    const width = 200;
    const height = 100;
    const barWidth = width / data.length;
    
    return (
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>{title}</Typography>
        <svg width={width} height={height + 20} style={{ border: '1px solid #ddd' }}>
          {data.map((bin, i) => (
            <g key={i}>
              <rect
                x={i * barWidth}
                y={height - (bin.count / maxCount) * height}
                width={barWidth - 1}
                height={(bin.count / maxCount) * height}
                fill={color}
                opacity={0.7}
              />
              <text
                x={i * barWidth + barWidth / 2}
                y={height + 15}
                textAnchor="middle"
                fontSize="8"
                fill="#666"
              >
                {bin.label.split('-')[0]}
              </text>
            </g>
          ))}
          <text x={width / 2} y={height + 15} textAnchor="middle" fontSize="8" fill="#666">
            {title}
          </text>
        </svg>
      </Box>
    );
  };
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
          <Typography variant="subtitle1" gutterBottom>
            Data Distribution
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <SimpleHistogram 
                data={twsHistogram} 
                title="TWS (knots)" 
                color="#1976d2" 
              />
            </Grid>
            <Grid item>
              <SimpleHistogram 
                data={twaHistogram} 
                title="TWA (degrees)" 
                color="#388e3c" 
              />
            </Grid>
            <Grid item>
              <SimpleHistogram 
                data={bspHistogram} 
                title="BSP (knots)" 
                color="#f57c00" 
              />
            </Grid>
          </Grid>
        </>
      )}
    </Paper>
  );
};

export default ParquetDataSummary;
