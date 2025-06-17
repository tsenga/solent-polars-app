import React, { useState, useEffect } from 'react';
import './App.css';
import { ThemeProvider, createTheme, CssBaseline, Container, Typography, Box } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './store';
import LinePolarChart from './components/LinePolarChart';
import PolarDataTable from './components/PolarDataTable';
import WindSpeedSelector from './components/WindSpeedSelector';
import FileSelector from './components/FileSelector';
import DataSourceSelection from './components/DataSourceSelection';
import ViewSettings from './components/ViewSettings';
import NavigationDrawer from './components/NavigationDrawer';

// Sample initial data with anchor points
const initialPolarData = [
  { windSpeed: 5, anchorPoints: [
    { angle: 0, boatSpeed: 0 },
    { angle: 45, boatSpeed: 2.5 },
    { angle: 90, boatSpeed: 3.8 },
    { angle: 135, boatSpeed: 3.2 },
    { angle: 180, boatSpeed: 2.0 }
  ]},
  { windSpeed: 10, anchorPoints: [
    { angle: 0, boatSpeed: 0 },
    { angle: 45, boatSpeed: 4.2 },
    { angle: 90, boatSpeed: 6.1 },
    { angle: 135, boatSpeed: 5.0 },
    { angle: 180, boatSpeed: 3.5 }
  ]},
  { windSpeed: 15, anchorPoints: [
    { angle: 0, boatSpeed: 0 },
    { angle: 45, boatSpeed: 5.8 },
    { angle: 90, boatSpeed: 7.5 },
    { angle: 135, boatSpeed: 6.3 },
    { angle: 180, boatSpeed: 4.2 }
  ]}
];

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
  const [polarData, setPolarData] = useState(initialPolarData);
  const [selectedWindSpeeds, setSelectedWindSpeeds] = useState([10]);
  const [editingWindSpeed, setEditingWindSpeed] = useState(10);
  const [plotAbsoluteTwa, setPlotAbsoluteTwa] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dataSource');
  
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
  
  // Update boat speed for a specific angle
  const updateBoatSpeed = (angle, newSpeed) => {
    setPolarData(prevData => {
      return prevData.map(windData => {
        if (windData.windSpeed === editingWindSpeed) {
          // Find if this angle is already an anchor point
          const existingAnchorIndex = windData.anchorPoints.findIndex(p => p.angle === angle);
          
          if (existingAnchorIndex >= 0) {
            // Update existing anchor point
            const updatedAnchorPoints = [...windData.anchorPoints];
            updatedAnchorPoints[existingAnchorIndex] = {
              ...updatedAnchorPoints[existingAnchorIndex],
              boatSpeed: parseFloat(newSpeed)
            };
            
            return {
              ...windData,
              anchorPoints: updatedAnchorPoints
            };
          } else {
            // Add a new anchor point
            return {
              ...windData,
              anchorPoints: [
                ...windData.anchorPoints,
                { angle, boatSpeed: parseFloat(newSpeed) }
              ].sort((a, b) => a.angle - b.angle)
            };
          }
        }
        return windData;
      });
    });
  };

  // Add a new anchor point
  const addAngleEntry = (newAngle, newSpeed) => {
    setPolarData(prevData => {
      return prevData.map(windData => {
        // Check if angle already exists in this wind speed data
        const angleExists = windData.anchorPoints.some(a => a.angle === newAngle);
        if (angleExists) return windData;
        
        if (windData.windSpeed === editingWindSpeed) {
          // For the wind speed being edited, use the provided boat speed
          return {
            ...windData,
            anchorPoints: [...windData.anchorPoints, { 
              angle: newAngle, 
              boatSpeed: parseFloat(newSpeed) 
            }].sort((a, b) => a.angle - b.angle)
          };
        } else {
          // For other wind speeds, interpolate the boat speed
          const interpolatedSpeed = interpolateBoatSpeed(windData.anchorPoints, newAngle);
          
          return {
            ...windData,
            anchorPoints: [...windData.anchorPoints, { 
              angle: newAngle, 
              boatSpeed: interpolatedSpeed
            }].sort((a, b) => a.angle - b.angle)
          };
        }
      });
    });
  };

  // Delete an anchor point
  const deleteAngleEntry = (angle) => {
    setPolarData(prevData => {
      return prevData.map(windData => {
        if (windData.windSpeed === editingWindSpeed) {
          return {
            ...windData,
            anchorPoints: windData.anchorPoints.filter(a => a.angle !== angle)
          };
        }
        return windData;
      });
    });
  };

  // Add a new wind speed
  const addWindSpeed = (newWindSpeed) => {
    if (polarData.some(data => data.windSpeed === newWindSpeed)) {
      alert('This wind speed already exists');
      return;
    }
    
    setPolarData(prevData => {
      return [...prevData, {
        windSpeed: newWindSpeed,
        anchorPoints: [
          { angle: 0, boatSpeed: 0 },
          { angle: 45, boatSpeed: 0 },
          { angle: 90, boatSpeed: 0 },
          { angle: 135, boatSpeed: 0 },
          { angle: 180, boatSpeed: 0 }
        ]
      }].sort((a, b) => a.windSpeed - b.windSpeed);
    });
    
    setSelectedWindSpeeds(prev => [...prev, newWindSpeed]);
    setEditingWindSpeed(newWindSpeed);
  };

  // Delete a wind speed
  const deleteWindSpeed = (windSpeed) => {
    if (polarData.length <= 1) {
      alert('Cannot delete the last wind speed entry');
      return;
    }
    
    setPolarData(prevData => {
      const newData = prevData.filter(data => data.windSpeed !== windSpeed);
      // If we're deleting a currently selected wind speed, remove it from selection
      setSelectedWindSpeeds(prev => {
        const newSelection = prev.filter(speed => speed !== windSpeed);
        // If we removed all selections, select the first available wind speed
        return newSelection.length > 0 ? newSelection : [newData[0].windSpeed];
      });
      
      // If we're deleting the wind speed being edited, switch to another one
      if (windSpeed === editingWindSpeed) {
        setEditingWindSpeed(newData[0].windSpeed);
      }
      return newData;
    });
  };

  // Handle loading polar data from a file
  const handleFileLoad = (loadedPolarData) => {
    if (loadedPolarData && loadedPolarData.length > 0) {
      setPolarData(loadedPolarData);
      // Select the first wind speed by default
      const firstWindSpeed = loadedPolarData[0].windSpeed;
      setSelectedWindSpeeds([firstWindSpeed]);
      setEditingWindSpeed(firstWindSpeed);
    }
  };


  const renderSectionContent = () => {
    switch (activeSection) {
      case 'dataSource':
        return (
          <DataSourceSelection 
            editingWindSpeed={editingWindSpeed}
            polarData={polarData}
          />
        );
      case 'files':
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
      case 'viewSettings':
        return (
          <ViewSettings 
            windSpeeds={polarData.map(data => data.windSpeed)}
            selectedWindSpeeds={selectedWindSpeeds}
            onSelectWindSpeed={setSelectedWindSpeeds}
            plotAbsoluteTwa={plotAbsoluteTwa}
            onPlotAbsoluteTwaChange={setPlotAbsoluteTwa}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NavigationDrawer
        isOpen={drawerOpen}
        onToggle={() => setDrawerOpen(!drawerOpen)}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      >
        {renderSectionContent()}
      </NavigationDrawer>
      <Box
        sx={{
          marginLeft: drawerOpen ? '600px' : 0,
          transition: 'margin-left 0.3s ease',
          minHeight: '100vh',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box component="header" sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h3" component="h1" gutterBottom>
              Polar Optimiser
            </Typography>
          </Box>
          <Box component="main" sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, flexWrap: 'wrap', gap: 3 }}>
            <div className="chart-container">
              <LinePolarChart 
                polarData={polarData}
                selectedWindSpeeds={selectedWindSpeeds}
                editingWindSpeed={editingWindSpeed}
                plotAbsoluteTwa={plotAbsoluteTwa}
                onUpdateAnchorPoint={(windSpeed, oldAngle, newAngle, newSpeed) => {
                  setPolarData(prevData => {
                    return prevData.map(windData => {
                      if (windData.windSpeed === windSpeed) {
                        // Find the anchor point with the old angle
                        const updatedAnchorPoints = windData.anchorPoints.map(point => {
                          if (Math.abs(point.angle - oldAngle) < 0.1) { // Small threshold for floating point comparison
                            return { angle: newAngle, boatSpeed: newSpeed };
                          }
                          return point;
                        });
                        
                        return {
                          ...windData,
                          anchorPoints: updatedAnchorPoints.sort((a, b) => a.angle - b.angle)
                        };
                      }
                      return windData;
                    });
                  });
                }}
              />
            </div>
            <div className="data-table">
              <PolarDataTable 
                data={selectedData.angles}
                windSpeed={editingWindSpeed}
                availableWindSpeeds={polarData.map(data => data.windSpeed)}
                onChangeWindSpeed={(newWindSpeed) => {
                  setEditingWindSpeed(newWindSpeed);
                  // If the new wind speed is not in the selected wind speeds, add it
                  if (!selectedWindSpeeds.includes(newWindSpeed)) {
                    setSelectedWindSpeeds(prev => [...prev, newWindSpeed]);
                  }
                }}
                onUpdateBoatSpeed={updateBoatSpeed}
                onAddAngleEntry={addAngleEntry}
                onDeleteAngleEntry={deleteAngleEntry}
                onAddWindSpeed={addWindSpeed}
                onDeleteWindSpeed={deleteWindSpeed}
              />
            </div>
          </Box>
        </Container>
      </Box>
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
