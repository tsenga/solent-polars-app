import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { ThemeProvider, createTheme, CssBaseline, Container, Typography, Box, Tabs, Tab, Grid } from '@mui/material';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store } from './store';
import { setFilteredData, setDisplayedData, setEditingWindSpeed as setEditingWindSpeedAction, updateEditingWindSpeed } from './store/parquetDataSlice';
import { setTwsRange } from './store/filterSlice';
import { 
  setPolarData, 
  setSelectedWindSpeeds, 
  updateBoatSpeed, 
  addAngleEntry, 
  deleteAngleEntry, 
  addWindSpeed, 
  deleteWindSpeed, 
  updateAnchorPoint,
  selectPolarData,
  selectSelectedWindSpeeds 
} from './store/polarDataSlice';
import LinePolarChart from './components/LinePolarChart';
import PolarDataTable from './components/PolarDataTable';
import FileSelector from './components/FileSelector';
import DataSourceSelection from './components/DataSourceSelection';
import ViewSettings from './components/ViewSettings';
import RaceDetailsManager from './components/RaceDetailsManager';


// Helper function to interpolate boat speed between two anchor points
const interpolateBoatSpeed = (anchorPoints, newAngle) => {
  // Sort anchor points by angle value
  const sortedPoints = [...anchorPoints].sort((a, b) => a.angle - b.angle);
  
  // If no anchor points, return 0
  if (sortedPoints.length === 0) return 0;
  
  // If only one anchor point, return its boat speed
  if (sortedPoints.length === 1) return sortedPoints[0].boatSpeed;
  
  // Find the anchor points before and after the new angle
  let lowerPoint = null;
  let upperPoint = null;
  
  for (let i = 0; i < sortedPoints.length; i++) {
    if (sortedPoints[i].angle < newAngle) {
      lowerPoint = sortedPoints[i];
    } else if (sortedPoints[i].angle > newAngle) {
      upperPoint = sortedPoints[i];
      break;
    }
  }
  
  // If new angle is less than all existing angles, use the first anchor point's boat speed
  if (lowerPoint === null) return sortedPoints[0].boatSpeed;
  
  // If new angle is greater than all existing angles, use the last anchor point's boat speed
  if (upperPoint === null) return sortedPoints[sortedPoints.length - 1].boatSpeed;
  
  // Interpolate between the two closest anchor points
  const ratio = (newAngle - lowerPoint.angle) / (upperPoint.angle - lowerPoint.angle);
  return lowerPoint.boatSpeed + ratio * (upperPoint.boatSpeed - lowerPoint.boatSpeed);
};

// Function to generate all points (1 degree increments) from anchor points
const generateAllPoints = (anchorPoints) => {
  if (!anchorPoints || anchorPoints.length === 0) return [];
  
  // Sort anchor points by angle
  const sortedAnchorPoints = [...anchorPoints].sort((a, b) => a.angle - b.angle);
  
  // Generate points for every degree from 0 to 180
  const allPoints = [];
  
  // First add all anchor points (including non-integer angles)
  sortedAnchorPoints.forEach(point => {
    allPoints.push({
      angle: point.angle,
      boatSpeed: point.boatSpeed,
      isAnchor: true
    });
  });
  
  // Then add integer degree points (if they're not already anchor points)
  for (let angle = 0; angle <= 180; angle++) {
    // Check if this integer angle already exists in our points (either as an anchor or already added)
    const existingPoint = allPoints.find(p => Math.abs(p.angle - angle) < 0.001);
    
    if (!existingPoint) {
      // Interpolate the boat speed
      const boatSpeed = interpolateBoatSpeed(sortedAnchorPoints, angle);
      allPoints.push({
        angle,
        boatSpeed,
        isAnchor: false
      });
    }
  }
  
  // Sort all points by angle
  allPoints.sort((a, b) => a.angle - b.angle);
  
  return allPoints;
};

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#007bff',
      lighter: 'rgba(0, 123, 255, 0.1)',
    },
    secondary: {
      main: '#6c757d',
    },
    success: {
      main: '#28a745',
    },
    error: {
      main: '#dc3545',
    },
  },
});

function AppContent() {
  const dispatch = useDispatch();
  const { rawData, filteredData, editingWindSpeed } = useSelector((state) => state.parquetData);
  const { useMockData } = useSelector((state) => state.filter);
  const polarData = useSelector(selectPolarData);
  const selectedWindSpeeds = useSelector(selectSelectedWindSpeeds);
  const [plotAbsoluteTwa, setPlotAbsoluteTwa] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  
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

    // Filter points that are within ±2.5 knots of the editing wind speed
    const filtered = data.filter(point => {
      const twsDiff = Math.abs(point.tws - windSpeed);
      return twsDiff <= 2.5;
    });

    console.log(`Filtered parquet points for TWS ${windSpeed} (±2.5): ${filtered.length}`);
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

  // Fetch parquet data for the first wind speed when polar data is loaded
  useEffect(() => {
    if (polarData && polarData.length > 0) {
      const firstWindSpeed = polarData[0].windSpeed;
      console.log(`App: Fetching initial parquet data for first wind speed: ${firstWindSpeed}`);
      dispatch(setEditingWindSpeedAction({ editingWindSpeed: firstWindSpeed, polarData }));
    }
  }, [polarData, dispatch]);

  // Track previous editing wind speed to avoid unnecessary dispatches
  const prevEditingWindSpeed = useRef(editingWindSpeed);
  const windSpeedChangeTimeoutRef = useRef(null);
  
  // Update displayed data when editing wind speed changes
  useEffect(() => {
    console.log(`App: editingWindSpeed changed to ${editingWindSpeed}`);
    
    // Immediately update displayed data for responsive UI
    if (filteredData.length > 0 && editingWindSpeed && polarData && polarData.length > 0) {
      const twsBands = polarData.map(data => data.windSpeed);
      console.log(`App: Filtering parquet data for editing wind speed: ${editingWindSpeed}`);
      const displayedForWindSpeed = filterParquetDataForEditingWindSpeed(filteredData, editingWindSpeed, twsBands);
      console.log(`App: Dispatching ${displayedForWindSpeed.length} points for display`);
      dispatch(setDisplayedData(displayedForWindSpeed));
    }
  }, [editingWindSpeed, filteredData, polarData, dispatch]);

  // Separate effect for server requests to avoid blocking UI
  useEffect(() => {
    // Debounce the server request to avoid blocking the UI
    if (editingWindSpeed !== prevEditingWindSpeed.current && editingWindSpeed && polarData && polarData.length > 0) {
      // Clear any existing timeout
      if (windSpeedChangeTimeoutRef.current) {
        clearTimeout(windSpeedChangeTimeoutRef.current);
      }
      
      // Debounce the server request with a longer delay
      windSpeedChangeTimeoutRef.current = setTimeout(() => {
        console.log(`App: Dispatching setEditingWindSpeed action for wind speed: ${editingWindSpeed}`);
        console.log(`App: Previous wind speed was: ${prevEditingWindSpeed.current}`);
        console.log(`App: Polar data has ${polarData.length} wind speeds:`, polarData.map(p => p.windSpeed));
        dispatch(setEditingWindSpeedAction({ editingWindSpeed, polarData }));
        prevEditingWindSpeed.current = editingWindSpeed;
      }, 1000); // Increased to 1000ms delay for server requests
    }
  }, [editingWindSpeed, polarData, dispatch]);
  
  // Helper function to calculate wind speed range
  const calculateWindSpeedRange = (editingWindSpeed, polarData) => {
    if (!editingWindSpeed || !polarData || polarData.length === 0) {
      return { minTws: 0, maxTws: Infinity };
    }

    // Get all wind speeds from polar data and sort them
    const allWindSpeeds = polarData.map(data => data.windSpeed).sort((a, b) => a - b);
    
    // Find the index of the editing wind speed
    const editingIndex = allWindSpeeds.indexOf(editingWindSpeed);
    
    if (editingIndex === -1) {
      // If editing wind speed is not in polar data, return full range
      return { minTws: 0, maxTws: Infinity };
    }

    let minTws, maxTws;

    // Calculate lower bound
    if (editingIndex === 0) {
      // This is the lowest wind speed, so lower bound is 0
      minTws = 0;
    } else {
      // Mid-point between editing wind speed and the next lower wind speed
      const lowerWindSpeed = allWindSpeeds[editingIndex - 1];
      minTws = (lowerWindSpeed + editingWindSpeed) / 2;
    }

    // Calculate upper bound
    if (editingIndex === allWindSpeeds.length - 1) {
      // This is the highest wind speed, so upper bound is infinity
      maxTws = Infinity;
    } else {
      // Mid-point between editing wind speed and the next higher wind speed
      const higherWindSpeed = allWindSpeeds[editingIndex + 1];
      maxTws = (editingWindSpeed + higherWindSpeed) / 2;
    }

    return { minTws, maxTws };
  };

  // Handle switching data sources and set TWS filters
  useEffect(() => {
    if (!useMockData && editingWindSpeed && polarData && polarData.length > 0) {
      console.log('App: Switched to real parquet data, setting TWS filters for editing wind speed:', editingWindSpeed);
      
      const windSpeedRange = calculateWindSpeedRange(editingWindSpeed, polarData);
      console.log('App: Calculated wind speed range:', windSpeedRange);
      
      // Set the min and max TWS filters
      const minTwsValue = windSpeedRange.minTws === 0 ? '' : windSpeedRange.minTws.toString();
      const maxTwsValue = windSpeedRange.maxTws === Infinity ? '' : windSpeedRange.maxTws.toString();
      
      dispatch(setTwsRange({minTws: minTwsValue, maxTws: maxTwsValue}));
      
      console.log('App: Set TWS filters - Min:', minTwsValue, 'Max:', maxTwsValue);
    } else if (useMockData) {
      console.log('App: Switched to mock data, clearing TWS filters');
      // Clear TWS filters when switching to mock data

      dispatch(setTwsRange({minTws: '', maxTws: ''}));
    }
  }, [useMockData, editingWindSpeed, polarData, dispatch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (windSpeedChangeTimeoutRef.current) {
        clearTimeout(windSpeedChangeTimeoutRef.current);
      }
    };
  }, []);

  // Find the data for the selected wind speeds and the one being edited
  const selectedWindSpeedData = polarData.find(data => data.windSpeed === editingWindSpeed) || 
                      (selectedWindSpeeds.length > 0 ? 
                        polarData.find(data => data.windSpeed === selectedWindSpeeds[0]) : 
                        polarData[0]);
  
  // Generate all points for the selected wind speed
  const selectedData = {
    ...selectedWindSpeedData,
    angles: generateAllPoints(selectedWindSpeedData.anchorPoints)
  };
  





  // Handle loading polar data from a file
  const handleFileLoad = (loadedPolarData) => {
    if (loadedPolarData && loadedPolarData.length > 0) {
      dispatch(setPolarData(loadedPolarData));
      // Select the first wind speed by default
      const firstWindSpeed = loadedPolarData[0].windSpeed;
      dispatch(setSelectedWindSpeeds([firstWindSpeed]));
      dispatch(updateEditingWindSpeed(firstWindSpeed));
    }
  };


  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Polar Files
        return (
          <FileSelector 
            onFileLoad={handleFileLoad} 
            onDownloadPolarFile={() => {
              // Generate polar file content
              let fileContent = "! Polar data file generated by Polar Chart App\n";
              fileContent += "! Format: Wind Speed, followed by pairs of Angle and Boat Speed\n";
              fileContent += `! Created: ${new Date().toISOString().split('T')[0]}\n`;
              
              // Add data for each wind speed
              polarData.forEach(windData => {
                let line = `${windData.windSpeed}`;
                // Sort anchor points by angle
                const sortedPoints = [...windData.anchorPoints].sort((a, b) => a.angle - b.angle);
                
                // Add each anchor point as a pair of angle and boat speed
                sortedPoints.forEach(point => {
                  line += `\t${point.angle}\t${point.boatSpeed}`;
                });
                
                fileContent += line + "\n";
              });
              
              // Create a blob and download link
              const blob = new Blob([fileContent], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'polar_data.pol';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          />
        );
      case 1: // Data Source
        return (
          <DataSourceSelection 
            editingWindSpeed={editingWindSpeed}
            polarData={polarData}
          />
        );
      case 2: // View Settings
        return (
          <ViewSettings 
            windSpeeds={polarData.map(data => data.windSpeed)}
            selectedWindSpeeds={selectedWindSpeeds}
            onSelectWindSpeed={(newSelectedWindSpeeds) => dispatch(setSelectedWindSpeeds(newSelectedWindSpeeds))}
            plotAbsoluteTwa={plotAbsoluteTwa}
            onPlotAbsoluteTwaChange={setPlotAbsoluteTwa}
          />
        );
      case 3: // Race Details
        return <RaceDetailsManager />;
      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Box component="header" sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Polar Optimiser
          </Typography>
        </Box>
        
        {/* Tabbed Interface */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Tabs value={activeTab < 3 ? activeTab : false} onChange={(event, newValue) => setActiveTab(newValue)}>
              <Tab label="Polar Files" />
              <Tab label="Data Source" />
              <Tab label="View Settings" />
            </Tabs>
            <Tabs value={activeTab === 3 ? 3 : false} onChange={(event, newValue) => setActiveTab(newValue)}>
              <Tab label="Race Details" value={3} />
            </Tabs>
          </Box>
        </Box>
        
        {/* Tab Content Row */}
        <Box sx={{ mb: 3 }}>
          {renderTabContent()}
        </Box>
        
        {/* Two Column Layout for Charts */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <LinePolarChart 
              editingWindSpeed={editingWindSpeed}
              plotAbsoluteTwa={plotAbsoluteTwa}
              onUpdateAnchorPoint={(windSpeed, oldAngle, newAngle, newSpeed) => {
                // Only update if the wind speed matches the current editing wind speed
                if (windSpeed !== editingWindSpeed) {
                  console.warn('Attempted to update anchor point for non-editing wind speed:', windSpeed, 'vs', editingWindSpeed);
                  return;
                }
                
                dispatch(updateAnchorPoint({ windSpeed, oldAngle, newAngle, newSpeed }));
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <PolarDataTable 
              data={selectedData.angles}
              windSpeed={editingWindSpeed}
              availableWindSpeeds={polarData.map(data => data.windSpeed)}
              onChangeWindSpeed={(newWindSpeed) => {
                dispatch(updateEditingWindSpeed(newWindSpeed));
                // If the new wind speed is not in the selected wind speeds, add it
                if (!selectedWindSpeeds.includes(newWindSpeed)) {
                  dispatch(setSelectedWindSpeeds([...selectedWindSpeeds, newWindSpeed]));
                }
              }}
              onUpdateBoatSpeed={handleUpdateBoatSpeed}
              onAddAngleEntry={handleAddAngleEntry}
              onDeleteAngleEntry={handleDeleteAngleEntry}
              onAddWindSpeed={handleAddWindSpeed}
              onDeleteWindSpeed={handleDeleteWindSpeed}
            />
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
