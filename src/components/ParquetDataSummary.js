import React, { useEffect } from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { setFilteredData, setDisplayedData } from '../store/parquetDataSlice';
import { setTimeFilterFromSummary } from '../store/filterSlice';
import TimeSeriesCharts from './TimeSeriesCharts';

const ParquetDataSummary = ({ editingWindSpeed, polarData }) => {
  const dispatch = useDispatch();
  const { rawData, filteredData, displayedData } = useSelector((state) => state.parquetData);
  
  const totalParquetData = rawData.length;
  const filteredParquetData = filteredData.length;
  const displayedParquetDataCount = displayedData.length;

  // Apply TWS band filtering in the browser
  const applyTwsBandFiltering = (data, twsBands) => {
    if (!data || data.length === 0 || !twsBands || twsBands.length === 0) {
      return data || [];
    }

    console.log(`Applying TWS band filtering for bands: [${twsBands.join(', ')}]`);
    console.log(`Total parquet points before TWS band filtering: ${data.length}`);

    const filtered = data.filter(point => {
      // Find the closest TWS band
      const closestBand = twsBands.reduce((closest, band) => {
        const currentDiff = Math.abs(point.tws - band);
        const closestDiff = Math.abs(point.tws - closest);
        return currentDiff < closestDiff ? band : closest;
      });
      
      // Only include if within reasonable range of the band (±2.5 knots)
      return Math.abs(point.tws - closestBand) <= 2.5;
    });

    console.log(`Parquet points after TWS band filtering: ${filtered.length}`);
    return filtered;
  };

  // Filter parquet data for the currently editing wind speed band
  const filterParquetDataForEditingWindSpeed = (data, windSpeed, twsBands) => {
    if (!data || data.length === 0) {
      console.log(`No parquet data to filter for wind speed ${windSpeed}`);
      return [];
    }

    console.log(`Filtering parquet data for editing wind speed: ${windSpeed}`);
    console.log(`Available TWS bands: [${twsBands.join(', ')}]`);
    console.log(`Total parquet points to filter: ${data.length}`);

    // Find the closest TWS band to the editing wind speed
    const filtered = data.filter(point => {
      const closestBand = twsBands.reduce((closest, band) => {
        const currentDiff = Math.abs(point.tws - band);
        const closestDiff = Math.abs(point.tws - closest);
        return currentDiff < closestDiff ? band : closest;
      });
      
      return closestBand === windSpeed;
    });

    console.log(`Filtered parquet points for TWS ${windSpeed}: ${filtered.length}`);
    console.log('Sample filtered points:', filtered.slice(0, 5).map(p => ({
      twa: p.twa,
      bsp: p.bsp,
      tws: p.tws
    })));

    return filtered;
  };

  // Update filtered data when raw data or polar data changes
  useEffect(() => {
    if (rawData.length > 0 && polarData && polarData.length > 0) {
      // Use actual wind speeds from polar data
      const twsBands = polarData.map(data => data.windSpeed);
      const twsBandFiltered = applyTwsBandFiltering(rawData, twsBands);
      dispatch(setFilteredData(twsBandFiltered));
    }
  }, [rawData, polarData, dispatch]);

  // Update displayed data when editing wind speed changes
  useEffect(() => {
    console.log(`ParquetDataSummary: editingWindSpeed changed to ${editingWindSpeed}`);
    if (filteredData.length > 0 && editingWindSpeed && polarData && polarData.length > 0) {
      const twsBands = polarData.map(data => data.windSpeed);
      console.log(`Filtering parquet data for editing wind speed: ${editingWindSpeed}`);
      const displayedForWindSpeed = filterParquetDataForEditingWindSpeed(filteredData, editingWindSpeed, twsBands);
      console.log(`Dispatching ${displayedForWindSpeed.length} points for display`);
      dispatch(setDisplayedData(displayedForWindSpeed));
    } else {
      console.log('Conditions not met for filtering:', {
        filteredDataLength: filteredData.length,
        editingWindSpeed,
        polarDataLength: polarData?.length || 0
      });
    }
  }, [editingWindSpeed, filteredData, polarData, dispatch]);
  
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Data Summary
      </Typography>
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
