import React from 'react';
import { Box, Typography } from '@mui/material';
import TimeSeriesWithHistogram from './TimeSeriesWithHistogram';

const TimeSeriesCharts = ({ data, onSetTimeFilter }) => {
  const [hoverX, setHoverX] = React.useState(null);
  const [hoverTime, setHoverTime] = React.useState(null);
  const [contextMenu, setContextMenu] = React.useState({ visible: false, x: 0, y: 0, timestamp: null });

   // Close context menu when clicking elsewhere
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside the context menu
      const contextMenuElement = event.target.closest('[data-context-menu]');
      if (!contextMenuElement) {
        setContextMenu({ visible: false, x: 0, y: 0, timestamp: null });
      }
    };
    
    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
    }
    
    // Always return cleanup function
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.visible]);

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
    // Don't hide context menu on mouse leave - let the click outside handler manage it
  };

  const handleMouseDown = (event, timestamp) => {
    // Show context menu immediately on click
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      timestamp: timestamp
    });
  };

  const handleMouseUp = () => {
    // No longer needed since we don't use a timer
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

 
  
  return (
    <Box sx={{ textAlign: 'left', mb: 2 }}>
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
          data-context-menu
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

export default TimeSeriesCharts;
