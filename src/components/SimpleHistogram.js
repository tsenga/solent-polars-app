import React from 'react';
import { Box, Typography } from '@mui/material';

const SimpleHistogram = ({ data, title, color = '#1976d2', valueExtent, chartHeight = 120 }) => {
  if (!data || data.length === 0) return null;
  
  const maxCount = Math.max(...data.map(d => d.count));
  const width = 150;
  const height = chartHeight; // Match the time series chart height
  const margin = { top: 10, right: 10, bottom: 20, left: 40 };
  const plotHeight = height - margin.top - margin.bottom;
  const plotWidth = width - margin.left - margin.right;
  const barHeight = plotHeight / data.length;
  
  // Use provided value extent or calculate from data
  const actualValueExtent = valueExtent || [
    Math.min(...data.map(d => parseFloat(d.label.split('-')[0]))),
    Math.max(...data.map(d => parseFloat(d.label.split('-')[1])))
  ];
  
  // Y scale to match the time series chart
  const yScale = (value) => plotHeight - ((value - actualValueExtent[0]) / (actualValueExtent[1] - actualValueExtent[0])) * plotHeight;
  
  return (
    <Box sx={{ textAlign: 'center', mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>Distribution</Typography>
      <svg width={width} height={height} style={{ border: '1px solid #ddd' }}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {data.map((bin, i) => {
            const binStart = parseFloat(bin.label.split('-')[0]);
            const binEnd = parseFloat(bin.label.split('-')[1]);
            const binCenter = (binStart + binEnd) / 2;
            const y = yScale(binEnd);
            const barWidth = (bin.count / maxCount) * plotWidth;
            
            return (
              <g key={i}>
                <rect
                  x={0}
                  y={y}
                  width={barWidth}
                  height={barHeight - 1}
                  fill={color}
                  opacity={0.7}
                />
                {/* Value labels on the left */}
                {i % 2 === 0 && (
                  <text
                    x={-5}
                    y={y + barHeight / 2}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize="8"
                    fill="#666"
                  >
                    {binStart.toFixed(1)}
                  </text>
                )}
              </g>
            );
          })}
          
          {/* Y-axis line */}
          <line x1={0} y1={0} x2={0} y2={plotHeight} stroke="#666" strokeWidth={1} />
          
          {/* X-axis line */}
          <line x1={0} y1={plotHeight} x2={plotWidth} y2={plotHeight} stroke="#666" strokeWidth={1} />
          
          {/* Count axis label */}
          <text
            x={plotWidth / 2}
            y={plotHeight + 15}
            textAnchor="middle"
            fontSize="8"
            fill="#666"
          >
            Count
          </text>
        </g>
      </svg>
    </Box>
  );
};

export default SimpleHistogram;
