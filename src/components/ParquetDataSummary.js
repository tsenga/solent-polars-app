import React from 'react';
import { Box, Typography, Chip, Grid, Card, CardContent } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { setTimeFilterFromSummary } from '../store/filterSlice';

const ParquetDataSummary = ({ editingWindSpeed, polarData }) => {
  const dispatch = useDispatch();
  const { rawData, filteredData, displayedData } = useSelector((state) => state.parquetData);
  const { summary, loading: summaryLoading, error: summaryError } = useSelector((state) => state.parquetDataSummary);
  
  const totalParquetData = rawData.length;
  const filteredParquetData = filteredData.length;
  const displayedParquetDataCount = displayedData.length;

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return typeof num === 'number' ? num.toFixed(2) : num;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  const renderHistogram = (data, title, unit, color = '#1976d2') => {
    if (!data || data.length === 0) return null;

    const maxCount = Math.max(...data.map(d => d.count));
    const maxBarHeight = 80;

    return (
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'end', gap: 1, height: maxBarHeight + 20, overflow: 'auto' }}>
            {data.slice(0, 10).map((item, index) => {
              const barHeight = (item.count / maxCount) * maxBarHeight;
              return (
                <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 30 }}>
                  <Typography variant="caption" sx={{ mb: 0.5, fontSize: '10px' }}>
                    {item.count}
                  </Typography>
                  <Box
                    sx={{
                      width: 20,
                      height: barHeight,
                      backgroundColor: color,
                      borderRadius: '2px 2px 0 0',
                      opacity: 0.8,
                    }}
                  />
                  <Typography variant="caption" sx={{ mt: 0.5, fontSize: '9px', transform: 'rotate(-45deg)', transformOrigin: 'center' }}>
                    {item.bin}{unit}
                  </Typography>
                </Box>
              );
            })}
            {data.length > 10 && (
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', ml: 1 }}>
                +{data.length - 10} more
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Data Summary
      </Typography>
      
      {/* Current filter results */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap', mb: 2 }}>
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
          label={`Displayed (TWS ${editingWindSpeed}): ${displayedParquetDataCount}`}
          color="secondary"
          variant="filled"
        />
      </Box>

      {/* Summary statistics from API */}
      {summaryLoading && (
        <Typography variant="body2" color="text.secondary">
          Loading summary data...
        </Typography>
      )}

      {summaryError && (
        <Typography variant="body2" color="error">
          Error loading summary: {summaryError}
        </Typography>
      )}

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Total Points Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="primary">
                  {summary.totalPoints?.toLocaleString() || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Data Points
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Boat Speed Stats */}
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Boat Speed (knots)
                </Typography>
                <Typography variant="body2">
                  Min: {formatNumber(summary.bsp?.min)}
                </Typography>
                <Typography variant="body2">
                  Max: {formatNumber(summary.bsp?.max)}
                </Typography>
                <Typography variant="body2">
                  Avg: {formatNumber(summary.bsp?.avg)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* True Wind Angle Stats */}
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  True Wind Angle (°)
                </Typography>
                <Typography variant="body2">
                  Min: {formatNumber(summary.twa?.min)}
                </Typography>
                <Typography variant="body2">
                  Max: {formatNumber(summary.twa?.max)}
                </Typography>
                <Typography variant="body2">
                  Avg: {formatNumber(summary.twa?.avg)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* True Wind Speed Stats */}
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  True Wind Speed (knots)
                </Typography>
                <Typography variant="body2">
                  Min: {formatNumber(summary.tws?.min)}
                </Typography>
                <Typography variant="body2">
                  Max: {formatNumber(summary.tws?.max)}
                </Typography>
                <Typography variant="body2">
                  Avg: {formatNumber(summary.tws?.avg)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Time Range */}
          {summary.timeRange && (summary.timeRange.start || summary.timeRange.end) && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Data Time Range
                  </Typography>
                  <Typography variant="body2">
                    Start: {formatDateTime(summary.timeRange.start)}
                  </Typography>
                  <Typography variant="body2">
                    End: {formatDateTime(summary.timeRange.end)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Histograms */}
          {summary.histograms && (
            <>
              {summary.histograms.tws && summary.histograms.tws.length > 0 && (
                <Grid item xs={12} sm={4}>
                  {renderHistogram(summary.histograms.tws, 'Wind Speed Distribution', ' kts', '#2196f3')}
                </Grid>
              )}
              
              {summary.histograms.bsp && summary.histograms.bsp.length > 0 && (
                <Grid item xs={12} sm={4}>
                  {renderHistogram(summary.histograms.bsp, 'Boat Speed Distribution', ' kts', '#4caf50')}
                </Grid>
              )}
              
              {summary.histograms.twa && summary.histograms.twa.length > 0 && (
                <Grid item xs={12} sm={4}>
                  {renderHistogram(summary.histograms.twa, 'Wind Angle Distribution', '°', '#ff9800')}
                </Grid>
              )}
            </>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default ParquetDataSummary;
