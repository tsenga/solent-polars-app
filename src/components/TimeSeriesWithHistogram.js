import React from 'react';
import { Box, Typography } from '@mui/material';
import SimpleHistogram from './SimpleHistogram';

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

const TimeSeriesWithHistogram = ({ 
  data, 
  valueKey, 
  title, 
  color, 
  unit, 
  showXAxis = false,
  hoverX = null,
  hoverTime = null,
  timeExtent = null,
  onMouseMove = null,
  onMouseLeave = null,
  onMouseDown = null,
  onMouseUp = null
}) => {
  if (!data || data.length === 0) return null;
  
  // Sort data by timestamp
  const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  const width = 600;
  const height = 120;
  const margin = { top: 10, right: 60, bottom: showXAxis ? 40 : 20, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Use provided timeExtent or calculate from data
  const actualTimeExtent = timeExtent || [
    new Date(sortedData[0].timestamp),
    new Date(sortedData[sortedData.length - 1].timestamp)
  ];
  
  const xScale = (timestamp) => {
    const time = new Date(timestamp);
    return ((time - actualTimeExtent[0]) / (actualTimeExtent[1] - actualTimeExtent[0])) * chartWidth;
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
    const time = new Date(actualTimeExtent[0].getTime() + ratio * (actualTimeExtent[1] - actualTimeExtent[0]));
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
            
            {/* Hover guideline */}
            {hoverX !== null && (
              <line
                x1={hoverX}
                y1={0}
                x2={hoverX}
                y2={chartHeight}
                stroke="#333"
                strokeWidth={1}
                strokeDasharray="3,3"
              />
            )}
            
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
            
            {/* Hover time label (only on bottom chart) */}
            {showXAxis && hoverX !== null && hoverTime && (
              <text
                x={hoverX}
                y={chartHeight + 30}
                textAnchor="middle"
                fontSize="10"
                fill="#333"
                fontWeight="bold"
              >
                {formatTime(hoverTime)}
              </text>
            )}
            
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
            
            {/* Invisible overlay for mouse events */}
            <rect
              x={0}
              y={0}
              width={chartWidth}
              height={chartHeight}
              fill="transparent"
              onMouseMove={(e) => {
                if (onMouseMove) {
                  const svgRect = e.currentTarget.closest('svg').getBoundingClientRect();
                  const x = e.clientX - svgRect.left - margin.left;
                  
                  // Convert x position back to timestamp
                  const ratio = x / chartWidth;
                  const timestamp = new Date(actualTimeExtent[0].getTime() + ratio * (actualTimeExtent[1] - actualTimeExtent[0]));
                  
                  onMouseMove(x, timestamp);
                }
              }}
              onMouseLeave={() => {
                if (onMouseLeave) {
                  onMouseLeave();
                }
              }}
              onMouseDown={(e) => {
                if (onMouseDown) {
                  const svgRect = e.currentTarget.closest('svg').getBoundingClientRect();
                  const x = e.clientX - svgRect.left - margin.left;
                  
                  // Convert x position back to timestamp
                  const ratio = x / chartWidth;
                  const timestamp = new Date(actualTimeExtent[0].getTime() + ratio * (actualTimeExtent[1] - actualTimeExtent[0]));
                  
                  onMouseDown(e, timestamp);
                }
              }}
              onMouseUp={() => {
                if (onMouseUp) {
                  onMouseUp();
                }
              }}
            />
          </g>
        </svg>
      </Box>
      
      {/* Histogram */}
      <SimpleHistogram 
        data={histogramData} 
        title={`Distribution`} 
        color={color} 
      />
    </Box>
  );
};

export default TimeSeriesWithHistogram;
