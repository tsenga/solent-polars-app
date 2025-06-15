import React, { useRef, useEffect } from 'react';
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
        borderRadius: '5px',
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 1000,
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
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

const LinePolarChart = ({ polarData, selectedWindSpeeds, editingWindSpeed, parquetData = [], onUpdateAnchorPoint }) => {
  const chartRef = useRef(null);
  // Find all data for selected wind speeds
  const selectedData = polarData.filter(data => 
    selectedWindSpeeds.includes(data.windSpeed)
  );
  
  // Prepare data for the chart
  const chartData = [];
  
  // Get all unique angles across all selected wind speeds
  const allAngles = new Set();
  selectedData.forEach(windData => {
    // Make sure to include all angles from the data
    windData.angles.forEach(angleData => {
      allAngles.add(angleData.angle);
    });
    
    // Also explicitly add all anchor points to ensure they're included
    if (windData.anchorPoints) {
      windData.anchorPoints.forEach(point => {
        allAngles.add(point.angle);
      });
    }
  });

  // Prepare parquet data for scatter plot
  const scatterData = parquetData.map(point => ({
    angle: point.twa,
    boatSpeed: point.bsp,
    tws: point.tws,
    timestamp: point.timestamp
  }));
  
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
  const domain = [0, Math.ceil(maxBoatSpeed)]; // Round up to next full BSP
  
  // Add drag functionality
  useEffect(() => {
    if (!chartRef.current) return;
    
    const chartContainer = chartRef.current;
    
    // Find all draggable anchor points
    const anchorPoints = chartContainer.querySelectorAll('.draggable-anchor');
    
    let isDragging = false;
    let currentPoint = null;
    let originalAngle = 0;
    let originalBoatSpeed = 0;
    let windSpeed = 0;
    
    // Calculate polar coordinates from mouse position
    const calculatePolarCoordinates = (event) => {
      const chartRect = chartContainer.getBoundingClientRect();
      const centerX = chartRect.width / 2;
      const centerY = chartRect.height / 2;
      
      const x = event.clientX - chartRect.left;
      const y = event.clientY - chartRect.top;
      
      // Calculate angle (0 at top, clockwise)
      let angle = Math.atan2(x - centerX, -(y - centerY)) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      
      // Constrain to 0-180 degrees (right half)
      angle = Math.min(180, Math.max(0, angle));
      
      // Calculate distance from center
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      
      // Convert distance to boat speed (approximate)
      // This is an approximation as we don't have direct access to the chart's scaling
      const maxRadius = Math.min(chartRect.width, chartRect.height) / 2;
      const maxBoatSpeed = Math.max(...selectedData.flatMap(d => d.angles.map(a => a.boatSpeed)));
      const boatSpeed = Math.max(0, (distance / maxRadius) * maxBoatSpeed * 1.2);
      
      return { angle, boatSpeed };
    };
    
    // Add event listeners to each anchor point
    anchorPoints.forEach(point => {
      point.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        currentPoint = point;
        originalAngle = parseFloat(point.getAttribute('data-angle'));
        originalBoatSpeed = parseFloat(point.getAttribute('data-boat-speed'));
        windSpeed = parseFloat(point.getAttribute('data-wind-speed'));
        
        document.body.style.cursor = 'move';
      });
    });
    
    // Add document-level event listeners for drag and release
    document.addEventListener('mousemove', (e) => {
      if (!isDragging || !currentPoint) return;
      
      const { angle, boatSpeed } = calculatePolarCoordinates(e);
      
      // Update tooltip to show current position
      const tooltip = chartContainer.querySelector('.custom-tooltip');
      if (tooltip) {
        tooltip.style.visibility = 'visible';
        tooltip.style.left = `${e.clientX + 10}px`;
        tooltip.style.top = `${e.clientY - 28}px`;
        tooltip.innerHTML = `
          <p style="font-weight: bold">Angle: ${angle.toFixed(2)}°</p>
          <p style="color: ${currentPoint.getAttribute('stroke')}">
            ${windSpeed} knots (editing): ${boatSpeed.toFixed(2)} knots
          </p>
        `;
      }
    });
    
    document.addEventListener('mouseup', (e) => {
      if (!isDragging || !currentPoint) return;
      
      const { angle, boatSpeed } = calculatePolarCoordinates(e);
      
      // Call the update function
      if (onUpdateAnchorPoint) {
        onUpdateAnchorPoint(
          windSpeed,
          originalAngle,
          parseFloat(angle.toFixed(2)),
          parseFloat(boatSpeed.toFixed(2))
        );
      }
      
      // Reset state
      isDragging = false;
      currentPoint = null;
      document.body.style.cursor = 'default';
      
      // Hide tooltip
      const tooltip = chartContainer.querySelector('.custom-tooltip');
      if (tooltip) {
        tooltip.style.visibility = 'hidden';
      }
    });
    
    // Clean up event listeners
    return () => {
      document.removeEventListener('mousemove', null);
      document.removeEventListener('mouseup', null);
    };
  }, [selectedData, editingWindSpeed, onUpdateAnchorPoint]);

  return (
    <div style={{ width: '100%', height: '100%' }} ref={chartRef}>
      <h2>Polar Chart for Selected Wind Speeds</h2>
      {parquetData.length > 0 && (
        <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
          Showing {parquetData.length} data points for TWS band {editingWindSpeed} knots
        </div>
      )}
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
            ticks={Array.from({ length: domain[1] + 1 }, (_, i) => i)}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}`}
          />
          
          {selectedData.map((windData, index) => {
            // Generate different colors for each wind speed
            const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28'];
            // If this is the wind speed being edited, use red
            const isBeingEdited = windData.windSpeed === editingWindSpeed;
            const stroke = isBeingEdited ? '#ff0000' : colors[index % colors.length];
            
            const checkIsAnchorPoint = (point) => {
              const adjPoint = (point >= 0) ? 90-point : Math.abs(point) + 90 

              return windData.anchorPoints.some(p => p.angle === adjPoint)
            }

            // Debug: Log radar component inputs
            console.log(`Radar for wind speed ${windData.windSpeed}:`, {
              isBeingEdited,
              anchorPoints: windData.anchorPoints.map(p => p.angle),
              chartDataLength: chartData.length,
              chartDataSample: chartData.slice(0, 3),
              chartDataAngles: chartData.filter(d => d.angle % 45 === 0).map(d => d.angle)
            });
            
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
                  // The angle in the payload is the actual angle value (0-180)
                  const angle = props.payload.angle;
                  const isAnchorPoint = checkIsAnchorPoint(angle);
                                    
                  return isAnchorPoint && isBeingEdited ? (
                    <circle 
                      cx={props.cx} 
                      cy={props.cy} 
                      r={3} 
                      fill={stroke} 
                      stroke="white" 
                      strokeWidth={1}
                      style={{ cursor: 'move' }}
                      className="draggable-anchor"
                      data-angle={angle}
                      data-wind-speed={windData.windSpeed}
                      data-boat-speed={props.payload[`wind${windData.windSpeed}`]}
                    />
                  ) : null;
                }}
                activeDot={(props) => {
                  // Only show active dots for anchor points of the wind speed being edited
                  const angle = props.payload.angle;
                  const isAnchorPoint = checkIsAnchorPoint(angle);

                  return isAnchorPoint && isBeingEdited ? (
                    <circle 
                      cx={props.cx} 
                      cy={props.cy} 
                      r={5} 
                      fill={stroke} 
                      stroke="white" 
                      strokeWidth={2}
                      style={{ cursor: 'move' }}
                      className="draggable-anchor"
                      data-angle={angle}
                      data-wind-speed={windData.windSpeed}
                      data-boat-speed={props.payload[`wind${windData.windSpeed}`]}
                    />
                  ) : null;
                }}
                curve="natural"
                connectNulls={true}
              />
            );
          })}
          <Tooltip 
            content={<CustomTooltip editingWindSpeed={editingWindSpeed} />}
            position={{ x: 0, y: 0 }}
            wrapperStyle={{ pointerEvents: 'none' }}
            cursor={false}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <p>Angle (degrees) vs Boat Speed (knots)</p>
      </div>
    </div>
  );
};

export default LinePolarChart;
