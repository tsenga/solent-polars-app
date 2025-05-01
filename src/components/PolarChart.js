import React from 'react';
import { 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer, 
  RadarChart,
  Radar,
  Tooltip
} from 'recharts';

const CustomTooltip = ({ active, payload, editingWindSpeed }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{
        backgroundColor: 'white',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '5px'
      }}>
        <p style={{ fontWeight: 'bold' }}>{`Angle: ${payload[0].payload.angle}°`}</p>
        {payload.map((entry, index) => {
          // Extract wind speed from the dataKey (e.g., "wind10" -> "10")
          const windSpeed = parseInt(entry.dataKey.replace('wind', ''));
          const isBeingEdited = windSpeed === editingWindSpeed;
          return (
            <p key={index} style={{ 
              color: entry.color,
              fontWeight: isBeingEdited ? 'bold' : 'normal',
            }}>
              {`${windSpeed} knots${isBeingEdited ? ' (editing)' : ''}: ${entry.value.toFixed(1)} knots`}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

const PolarChart = ({ polarData, selectedWindSpeeds, editingWindSpeed }) => {
  // Find all data for selected wind speeds
  const selectedData = polarData.filter(data => 
    selectedWindSpeeds.includes(data.windSpeed)
  );
  
  // Prepare data for the chart
  const chartData = [];
  
  // Get all unique angles across all selected wind speeds
  const allAngles = new Set();
  selectedData.forEach(windData => {
    windData.angles.forEach(angleData => {
      allAngles.add(angleData.angle);
    });
  });
  
  // Create chart data with all angles
  Array.from(allAngles).sort((a, b) => a - b).forEach(angle => {
    const dataPoint = { angle };
    
    // Add boat speed for each wind speed
    selectedData.forEach(windData => {
      const angleData = windData.angles.find(a => a.angle === angle);
      dataPoint[`wind${windData.windSpeed}`] = angleData ? angleData.boatSpeed : 0;
    });
    
    chartData.push(dataPoint);
  });
  
  // Find max boat speed for setting the domain
  const allBoatSpeeds = [];
  selectedData.forEach(windData => {
    windData.angles.forEach(angleData => {
      allBoatSpeeds.push(angleData.boatSpeed);
    });
  });
  
  const maxBoatSpeed = Math.max(...allBoatSpeeds) || 10;
  const domain = [0, Math.ceil(maxBoatSpeed * 1.2)]; // Add 20% margin
  
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <h2>Polar Chart for Selected Wind Speeds</h2>
      <ResponsiveContainer width="100%" height="80%">
        <RadarChart startAngle={90} endAngle={-90} cx="50%" cy="50%">
          <PolarGrid />
          <PolarAngleAxis
            dataKey="angle"
            type="number"
            domain={[0, 180]}
            tickCount={7}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}°`}
          />
          <PolarRadiusAxis
            angle={0}
            domain={domain}
            tickCount={6}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}`}
          />
          {selectedData.map((windData, index) => {
            // Generate different colors for each wind speed
            const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28'];
            // If this is the wind speed being edited, use red
            const isBeingEdited = windData.windSpeed === editingWindSpeed;
            const stroke = isBeingEdited ? '#ff0000' : colors[index % colors.length];
            
            return (
              <Radar
                key={windData.windSpeed}
                name={`${windData.windSpeed} knots${isBeingEdited ? ' (editing)' : ''}`}
                dataKey={`wind${windData.windSpeed}`}
                stroke={stroke}
                fill="none"
                strokeWidth={isBeingEdited ? 3 : 2}
                data={chartData}
                isAnimationActive={true}
                dot={(props) => {
                  // Only show dots for anchor points of the wind speed being edited
                  const isAnchorPoint = windData.anchorPoints.some(
                    point => point.angle === props.payload.angle
                  );
                  return isAnchorPoint && isBeingEdited ? (
                    <circle 
                      cx={props.cx} 
                      cy={props.cy} 
                      r={3} 
                      fill={stroke} 
                      stroke="white" 
                      strokeWidth={1} 
                    />
                  ) : null;
                }}
                activeDot={(props) => {
                  // Only show active dots for anchor points of the wind speed being edited
                  const isAnchorPoint = windData.anchorPoints.some(
                    point => point.angle === props.payload.angle
                  );
                  return isAnchorPoint && isBeingEdited ? (
                    <circle 
                      cx={props.cx} 
                      cy={props.cy} 
                      r={5} 
                      fill={stroke} 
                      stroke="white" 
                      strokeWidth={2} 
                    />
                  ) : null;
                }}
                curve="natural"
                connectNulls={true}
              />
            );
          })}
          <Tooltip content={<CustomTooltip editingWindSpeed={editingWindSpeed} />} />
        </RadarChart>
      </ResponsiveContainer>
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <p>Angle (degrees) vs Boat Speed (knots)</p>
      </div>
    </div>
  );
};

export default PolarChart;
