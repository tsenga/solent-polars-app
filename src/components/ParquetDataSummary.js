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
    const labelHeight = 40; // Extra space for rotated labels
    const barWidth = width / data.length;
    
    return (
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>{title}</Typography>
        <svg width={width} height={height + labelHeight} style={{ border: '1px solid #ddd' }}>
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
                y={height + 12}
                textAnchor="start"
                fontSize="8"
                fill="#666"
                transform={`rotate(270, ${i * barWidth + barWidth / 2}, ${height + 12})`}
              >
                {parseFloat(bin.label.split('-')[0]).toFixed(1)}
              </text>
            </g>
          ))}
          <text x={width / 2} y={height + labelHeight - 5} textAnchor="middle" fontSize="8" fill="#666">
            {title}
          </text>
        </svg>
      </Box>
    );
  };

  // Time series line chart component
  const TimeSeriesChart = ({ data }) => {
    if (!data || data.length === 0) return null;
    
    // Sort data by timestamp
    const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    const width = 600;
    const height = 200;
    const margin = { top: 20, right: 80, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Create scales
    const timeExtent = [
      new Date(sortedData[0].timestamp),
      new Date(sortedData[sortedData.length - 1].timestamp)
    ];
    
    const xScale = (timestamp) => {
      const time = new Date(timestamp);
      return ((time - timeExtent[0]) / (timeExtent[1] - timeExtent[0])) * chartWidth;
    };
    
    // Separate scales for each metric
    const twsExtent = [
      Math.min(...sortedData.map(d => d.tws)),
      Math.max(...sortedData.map(d => d.tws))
    ];
    const twaExtent = [0, 180]; // TWA is always 0-180
    const bspExtent = [
      Math.min(...sortedData.map(d => d.bsp)),
      Math.max(...sortedData.map(d => d.bsp))
    ];
    
    const twsScale = (value) => chartHeight - ((value - twsExtent[0]) / (twsExtent[1] - twsExtent[0])) * chartHeight;
    const twaScale = (value) => chartHeight - (value / 180) * chartHeight;
    const bspScale = (value) => chartHeight - ((value - bspExtent[0]) / (bspExtent[1] - bspExtent[0])) * chartHeight;
    
    // Generate path strings
    const generatePath = (scaleFunc, valueKey) => {
      return sortedData.map((d, i) => {
        const x = xScale(d.timestamp);
        const y = scaleFunc(d[valueKey]);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ');
    };
    
    const twsPath = generatePath(twsScale, 'tws');
    const twaPath = generatePath(twaScale, 'twa');
    const bspPath = generatePath(bspScale, 'bsp');
    
    // Format time labels
    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    // Generate time ticks
    const timeTicks = [];
    const tickCount = 5;
    for (let i = 0; i <= tickCount; i++) {
      const ratio = i / tickCount;
      const time = new Date(timeExtent[0].getTime() + ratio * (timeExtent[1] - timeExtent[0]));
      timeTicks.push({
        time,
        x: ratio * chartWidth,
        label: formatTime(time)
      });
    }
    
    return (
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Time Series</Typography>
        <svg width={width} height={height} style={{ border: '1px solid #ddd' }}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Grid lines */}
            {timeTicks.map((tick, i) => (
              <line
                key={i}
                x1={tick.x}
                y1={0}
                x2={tick.x}
                y2={chartHeight}
                stroke="#f0f0f0"
                strokeWidth={1}
              />
            ))}
            
            {/* Data lines */}
            <path d={twsPath} fill="none" stroke="#1976d2" strokeWidth={2} opacity={0.8} />
            <path d={twaPath} fill="none" stroke="#388e3c" strokeWidth={2} opacity={0.8} />
            <path d={bspPath} fill="none" stroke="#f57c00" strokeWidth={2} opacity={0.8} />
            
            {/* X-axis */}
            <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#666" strokeWidth={1} />
            
            {/* X-axis labels */}
            {timeTicks.map((tick, i) => (
              <text
                key={i}
                x={tick.x}
                y={chartHeight + 15}
                textAnchor="middle"
                fontSize="10"
                fill="#666"
              >
                {tick.label}
              </text>
            ))}
            
            {/* Y-axis */}
            <line x1={0} y1={0} x2={0} y2={chartHeight} stroke="#666" strokeWidth={1} />
            
            {/* Legend */}
            <g transform={`translate(${chartWidth + 10}, 20)`}>
              <text x={0} y={0} fontSize="10" fill="#1976d2">TWS</text>
              <text x={0} y={15} fontSize="10" fill="#388e3c">TWA</text>
              <text x={0} y={30} fontSize="10" fill="#f57c00">BSP</text>
            </g>
          </g>
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
            Time Series
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <TimeSeriesChart data={filteredData} />
          </Box>
          
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
