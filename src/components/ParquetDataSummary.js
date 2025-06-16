import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';

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

  // Combined time series charts component
  const TimeSeriesCharts = ({ data, onSetTimeFilter }) => {
    const [hoverX, setHoverX] = React.useState(null);
    const [hoverTime, setHoverTime] = React.useState(null);
    const [contextMenu, setContextMenu] = React.useState({ visible: false, x: 0, y: 0, timestamp: null });
    const [pressTimer, setPressTimer] = React.useState(null);
    
    if (!data || data.length === 0) return null;
    
    // Sort data by timestamp for consistent time extent
    const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    const timeExtent = [
      new Date(sortedData[0].timestamp),
      new Date(sortedData[sortedData.length - 1].timestamp)
    ];
    
    const handleMouseMove = (x, timestamp) => {
      setHoverX(x);
      setHoverTime(timestamp);
    };
    
    const handleMouseLeave = () => {
      setHoverX(null);
      setHoverTime(null);
      setContextMenu({ visible: false, x: 0, y: 0, timestamp: null });
      if (pressTimer) {
        clearTimeout(pressTimer);
        setPressTimer(null);
      }
    };

    const handleMouseDown = (event, timestamp) => {
      const timer = setTimeout(() => {
        setContextMenu({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          timestamp: timestamp
        });
      }, 500); // Show menu after 500ms hold
      setPressTimer(timer);
    };

    const handleMouseUp = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        setPressTimer(null);
      }
    };

    const handleSetStartTime = () => {
      if (contextMenu.timestamp && onSetTimeFilter) {
        onSetTimeFilter('start', contextMenu.timestamp);
      }
      setContextMenu({ visible: false, x: 0, y: 0, timestamp: null });
    };

    const handleSetEndTime = () => {
      if (contextMenu.timestamp && onSetTimeFilter) {
        onSetTimeFilter('end', contextMenu.timestamp);
      }
      setContextMenu({ visible: false, x: 0, y: 0, timestamp: null });
    };

    // Close context menu when clicking elsewhere
    React.useEffect(() => {
      const handleClickOutside = () => {
        setContextMenu({ visible: false, x: 0, y: 0, timestamp: null });
      };
      
      if (contextMenu.visible) {
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
      }
    }, [contextMenu.visible]);
    
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
          hoverX={hoverX}
          hoverTime={hoverTime}
          timeExtent={timeExtent}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        />
        <TimeSeriesWithHistogram 
          data={data} 
          valueKey="twa" 
          title="True Wind Angle" 
          color="#388e3c" 
          unit="TWA (degrees)"
          showXAxis={false}
          hoverX={hoverX}
          hoverTime={hoverTime}
          timeExtent={timeExtent}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        />
        <TimeSeriesWithHistogram 
          data={data} 
          valueKey="bsp" 
          title="Boat Speed" 
          color="#f57c00" 
          unit="BSP (knots)"
          showXAxis={true}
          hoverX={hoverX}
          hoverTime={hoverTime}
          timeExtent={timeExtent}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        />
        
        {/* Context Menu */}
        {contextMenu.visible && (
          <Box
            sx={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              zIndex: 1000,
              minWidth: '150px'
            }}
          >
            <Box
              sx={{
                padding: '8px 12px',
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#f5f5f5' }
              }}
              onClick={handleSetStartTime}
            >
              Set as Start Time
            </Box>
            <Box
              sx={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderTop: '1px solid #eee',
                '&:hover': { backgroundColor: '#f5f5f5' }
              }}
              onClick={handleSetEndTime}
            >
              Set as End Time
            </Box>
          </Box>
        )}
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
            <TimeSeriesCharts 
              data={rawParquetData} 
              onSetTimeFilter={(type, timestamp) => {
                // Format timestamp for datetime-local input
                const formattedTime = new Date(timestamp).toISOString().slice(0, 16);
                
                // Call parent component to update the filter
                if (window.setTimeFilter) {
                  window.setTimeFilter(type, formattedTime);
                }
              }}
            />
          </Box>
        </>
      )}
    </Paper>
  );
};

export default ParquetDataSummary;
