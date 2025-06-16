import React from 'react';
import { Box, Typography } from '@mui/material';

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

export default SimpleHistogram;
