import React from 'react';
import { Box, Typography, Paper, Chip, Grid } from '@mui/material';

const ParquetDataSummary = ({ 
  displayedParquetData, 
  filteredData = [],
  rawParquetData = [],
  editingWindSpeed 
}) => {
  const totalParquetData = rawParquetData.length;
  const filteredParquetData = filteredData.length;
  
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
  
  const twsHistogram = createHistogram(rawParquetData, 'tws', 8);
  const twaHistogram = createHistogram(rawParquetData, 'twa', 10);
  const bspHistogram = createHistogram(rawParquetData, 'bsp', 8);
  
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

  // Individual time series chart with histogram component
  const TimeSeriesWithHistogram = ({ data, valueKey, title, color, unit, showXAxis = false }) => {
    if (!data || data.length === 0) return null;
    
    // Sort data by timestamp
    const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    const width = 600;
    const height = 120;
    const margin = { top: 10, right: 60, bottom: showXAxis ? 40 : 20, left: 60 };
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
    
    // Value scale
    const valueExtent = valueKey === 'twa' 
      ? [-180, 180] 
      : [
          Math.min(...sortedData.map(d => d[valueKey])),
          Math.max(...sortedData.map(d => d[valueKey]))
        ];
    
    const yScale = (value) => chartHeight - ((value - valueExtent[0]) / (valueExtent[1] - valueExtent[0])) * chartHeight;
    
    // Generate path string
    const path = sortedData.map((d, i) => {
      const x = xScale(d.timestamp);
      const y = yScale(d[valueKey]);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
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
    
    // Generate Y ticks
    const yTicks = [];
    const yTickCount = 4;
    for (let i = 0; i <= yTickCount; i++) {
      const ratio = i / yTickCount;
      const value = valueExtent[0] + ratio * (valueExtent[1] - valueExtent[0]);
      yTicks.push({
        value,
        y: chartHeight - ratio * chartHeight,
        label: value.toFixed(1)
      });
    }
    
    // Create histogram data
    const histogramData = createHistogram(data, valueKey, 8);
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1, gap: 2 }}>
        {/* Time series chart */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="subtitle2" gutterBottom>{title}</Typography>
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
              
              {/* Horizontal grid lines */}
              {yTicks.map((tick, i) => (
                <line
                  key={i}
                  x1={0}
                  y1={tick.y}
                  x2={chartWidth}
                  y2={tick.y}
                  stroke="#f0f0f0"
                  strokeWidth={1}
                />
              ))}
              
              {/* Data line */}
              <path d={path} fill="none" stroke={color} strokeWidth={2} opacity={0.8} />
              
              {/* X-axis */}
              <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#666" strokeWidth={1} />
              
              {/* X-axis labels (only on bottom chart) */}
              {showXAxis && timeTicks.map((tick, i) => (
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
              
              {/* Y-axis labels */}
              {yTicks.map((tick, i) => (
                <text
                  key={i}
                  x={-10}
                  y={tick.y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize="10"
                  fill="#666"
                >
                  {tick.label}
                </text>
              ))}
              
              {/* Y-axis title */}
              <text
                x={-40}
                y={chartHeight / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fill="#666"
                transform={`rotate(-90, -40, ${chartHeight / 2})`}
              >
                {unit}
              </text>
            </g>
          </svg>
        </Box>
        
        {/* Histogram */}
        <SimpleHistogram 
          data={histogramData} 
          title={`${title} Distribution`} 
          color={color} 
        />
      </Box>
    );
  };

  // Combined time series charts component
  const TimeSeriesCharts = ({ data }) => {
    if (!data || data.length === 0) return null;
    
    return (
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Time Series</Typography>
        <TimeSeriesWithHistogram 
          data={data} 
          valueKey="tws" 
          title="True Wind Speed" 
          color="#1976d2" 
          unit="TWS (knots)"
          showXAxis={false}
        />
        <TimeSeriesWithHistogram 
          data={data} 
          valueKey="twa" 
          title="True Wind Angle" 
          color="#388e3c" 
          unit="TWA (degrees)"
          showXAxis={false}
        />
        <TimeSeriesWithHistogram 
          data={data} 
          valueKey="bsp" 
          title="Boat Speed" 
          color="#f57c00" 
          unit="BSP (knots)"
          showXAxis={true}
        />
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
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <TimeSeriesCharts data={rawParquetData} />
          </Box>
        </>
      )}
    </Paper>
  );
};

export default ParquetDataSummary;
