import React, { useState } from 'react';
import './App.css';
import PolarChart from './components/PolarChart';
import PolarDataTable from './components/PolarDataTable';
import WindSpeedSelector from './components/WindSpeedSelector';

// Sample initial data
const initialPolarData = [
  { windSpeed: 5, angles: [
    { angle: 0, boatSpeed: 0 },
    { angle: 45, boatSpeed: 2.5 },
    { angle: 90, boatSpeed: 3.8 },
    { angle: 135, boatSpeed: 3.2 },
    { angle: 180, boatSpeed: 2.0 }
  ]},
  { windSpeed: 10, angles: [
    { angle: 0, boatSpeed: 0 },
    { angle: 45, boatSpeed: 4.2 },
    { angle: 90, boatSpeed: 6.1 },
    { angle: 135, boatSpeed: 5.0 },
    { angle: 180, boatSpeed: 3.5 }
  ]},
  { windSpeed: 15, angles: [
    { angle: 0, boatSpeed: 0 },
    { angle: 45, boatSpeed: 5.8 },
    { angle: 90, boatSpeed: 7.5 },
    { angle: 135, boatSpeed: 6.3 },
    { angle: 180, boatSpeed: 4.2 }
  ]}
];

function App() {
  const [polarData, setPolarData] = useState(initialPolarData);
  const [selectedWindSpeed, setSelectedWindSpeed] = useState(10);
  
  // Find the data for the selected wind speed
  const selectedData = polarData.find(data => data.windSpeed === selectedWindSpeed) || polarData[0];
  
  // Update boat speed for a specific angle
  const updateBoatSpeed = (angle, newSpeed) => {
    setPolarData(prevData => {
      return prevData.map(windData => {
        if (windData.windSpeed === selectedWindSpeed) {
          return {
            ...windData,
            angles: windData.angles.map(angleData => {
              if (angleData.angle === angle) {
                return { ...angleData, boatSpeed: parseFloat(newSpeed) };
              }
              return angleData;
            })
          };
        }
        return windData;
      });
    });
  };

  // Add a new angle entry
  const addAngleEntry = (newAngle, newSpeed) => {
    setPolarData(prevData => {
      return prevData.map(windData => {
        if (windData.windSpeed === selectedWindSpeed) {
          // Check if angle already exists
          const angleExists = windData.angles.some(a => a.angle === newAngle);
          if (angleExists) return windData;
          
          return {
            ...windData,
            angles: [...windData.angles, { 
              angle: newAngle, 
              boatSpeed: parseFloat(newSpeed) 
            }].sort((a, b) => a.angle - b.angle)
          };
        }
        return windData;
      });
    });
  };

  // Delete an angle entry
  const deleteAngleEntry = (angle) => {
    setPolarData(prevData => {
      return prevData.map(windData => {
        if (windData.windSpeed === selectedWindSpeed) {
          return {
            ...windData,
            angles: windData.angles.filter(a => a.angle !== angle)
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
        angles: [
          { angle: 0, boatSpeed: 0 },
          { angle: 45, boatSpeed: 0 },
          { angle: 90, boatSpeed: 0 },
          { angle: 135, boatSpeed: 0 },
          { angle: 180, boatSpeed: 0 }
        ]
      }].sort((a, b) => a.windSpeed - b.windSpeed);
    });
    
    setSelectedWindSpeed(newWindSpeed);
  };

  // Delete a wind speed
  const deleteWindSpeed = (windSpeed) => {
    if (polarData.length <= 1) {
      alert('Cannot delete the last wind speed entry');
      return;
    }
    
    setPolarData(prevData => {
      const newData = prevData.filter(data => data.windSpeed !== windSpeed);
      // If we're deleting the currently selected wind speed, select another one
      if (windSpeed === selectedWindSpeed) {
        setSelectedWindSpeed(newData[0].windSpeed);
      }
      return newData;
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Interactive Polar Chart</h1>
      </header>
      <main>
        <div className="controls">
          <WindSpeedSelector 
            windSpeeds={polarData.map(data => data.windSpeed)}
            selectedWindSpeed={selectedWindSpeed}
            onSelectWindSpeed={setSelectedWindSpeed}
            onAddWindSpeed={addWindSpeed}
            onDeleteWindSpeed={deleteWindSpeed}
          />
        </div>
        <div className="chart-container">
          <PolarChart 
            data={selectedData.angles} 
            windSpeed={selectedWindSpeed}
          />
        </div>
        <div className="data-table">
          <PolarDataTable 
            data={selectedData.angles}
            onUpdateBoatSpeed={updateBoatSpeed}
            onAddAngleEntry={addAngleEntry}
            onDeleteAngleEntry={deleteAngleEntry}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
