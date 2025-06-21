import React from 'react';
import { Box, Typography, Chip, Grid, Card, CardContent } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { setTimeFilterFromSummary } from '../store/filterSlice';
import TimeSeriesCharts from './TimeSeriesCharts';

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
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Data Distribution
                  </Typography>
                  <Grid container spacing={2}>
                    {summary.histograms.tws && summary.histograms.tws.length > 0 && (
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" gutterBottom>
                          Wind Speed Distribution:
                        </Typography>
                        <Box sx={{ maxHeight: 100, overflow: 'auto' }}>
                          {summary.histograms.tws.slice(0, 5).map((item, index) => (
                            <Typography key={index} variant="caption" display="block">
                              {item.bin} kts: {item.count} points
                            </Typography>
                          ))}
                          {summary.histograms.tws.length > 5 && (
                            <Typography variant="caption" color="text.secondary">
                              ...and {summary.histograms.tws.length - 5} more
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    )}
                    
                    {summary.histograms.bsp && summary.histograms.bsp.length > 0 && (
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" gutterBottom>
                          Boat Speed Distribution:
                        </Typography>
                        <Box sx={{ maxHeight: 100, overflow: 'auto' }}>
                          {summary.histograms.bsp.slice(0, 5).map((item, index) => (
                            <Typography key={index} variant="caption" display="block">
                              {item.bin} kts: {item.count} points
                            </Typography>
                          ))}
                          {summary.histograms.bsp.length > 5 && (
                            <Typography variant="caption" color="text.secondary">
                              ...and {summary.histograms.bsp.length - 5} more
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    )}
                    
                    {summary.histograms.twa && summary.histograms.twa.length > 0 && (
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" gutterBottom>
                          Wind Angle Distribution:
                        </Typography>
                        <Box sx={{ maxHeight: 100, overflow: 'auto' }}>
                          {summary.histograms.twa.slice(0, 5).map((item, index) => (
                            <Typography key={index} variant="caption" display="block">
                              {item.bin}°: {item.count} points
                            </Typography>
                          ))}
                          {summary.histograms.twa.length > 5 && (
                            <Typography variant="caption" color="text.secondary">
                              ...and {summary.histograms.twa.length - 5} more
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
      
      {filteredData.length > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3 }}>
            <TimeSeriesCharts 
              data={rawData} 
              onSetTimeFilter={(type, timestamp) => {
                // Format timestamp for datetime-local input
                const formattedTime = new Date(timestamp).toISOString().slice(0, 16);
                
                // Dispatch Redux action to update the filter
                dispatch(setTimeFilterFromSummary({ type, formattedTime }));
              }}
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default ParquetDataSummary;
