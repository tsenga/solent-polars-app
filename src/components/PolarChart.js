import React, { useRef, useEffect, useState } from 'react';

const LinePolarChart = ({ polarData, selectedWindSpeeds, editingWindSpeed, parquetData = [], onUpdateAnchorPoint }) => {
  const chartRef = useRef(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });
  
  // Find all data for selected wind speeds
  const selectedData = polarData.filter(data => 
    selectedWindSpeeds.includes(data.windSpeed)
  );
  
  // Find max boat speed for setting the domain
  const allBoatSpeeds = [];
  selectedData.forEach(windData => {
    if (windData.anchorPoints) {
      windData.anchorPoints.forEach(anchorPoint => {
        allBoatSpeeds.push(anchorPoint.boatSpeed);
      });
    }
  });
  
  const maxBoatSpeed = Math.max(...allBoatSpeeds) || 10;
  const maxRadius = Math.ceil(maxBoatSpeed); // Round up to next full BSP
  const gridCircles = Array.from({ length: maxRadius + 1 }, (_, i) => i);
  
  // Debug logging
  console.log('Grid circle debug:', {
    maxBoatSpeed,
    maxRadius,
    gridCircles,
    expectedCircles: gridCircles.length
  });
  
  // Chart dimensions
  const width = 600;
  const height = 600;
  const centerX = width / 2;
  const centerY = height / 2;
  const chartRadius = Math.min(width, height) / 2 - 50; // Leave margin for labels
  
  // Convert polar coordinates to SVG coordinates
  const polarToSVG = (angle, radius) => {
    const angleRad = (angle - 90) * (Math.PI / 180); // -90 to start at top
    const scaledRadius = (radius / maxRadius) * chartRadius;
    return {
      x: centerX + scaledRadius * Math.cos(angleRad),
      y: centerY + scaledRadius * Math.sin(angleRad)
    };
  };
  
  // Generate path for a wind speed curve
  const generatePath = (windData) => {
    const points = windData.anchorPoints
      .filter(anchorPoint => anchorPoint.angle >= 0 && anchorPoint.angle <= 180)
      .sort((a, b) => a.angle - b.angle)
      .map(anchorPoint => polarToSVG(anchorPoint.angle, anchorPoint.boatSpeed));
    
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };
  
  // Generate colors for wind speeds
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28'];
  
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} ref={chartRef}>
      <h2>Polar Chart for Selected Wind Speeds</h2>
      {parquetData.length > 0 && (
        <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
          Showing {parquetData.length} data points for TWS band {editingWindSpeed} knots
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width={width} height={height} style={{ border: '1px solid #ddd' }}>
          {/* Grid circles */}
          {gridCircles.map(radius => {
            const circleRadius = (radius / maxRadius) * chartRadius;
            return (
              <circle
                key={radius}
                cx={centerX}
                cy={centerY}
                r={circleRadius}
                fill="none"
                stroke={radius === 0 ? "none" : "#e0e0e0"}
                strokeWidth={1}
              />
            );
          })}
          
          {/* Radial lines for angles */}
          {[0, 30, 45, 60, 90, 120, 135, 150, 180].map(angle => {
            const { x, y } = polarToSVG(angle, maxRadius);
            return (
              <line
                key={angle}
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                stroke="#e0e0e0"
                strokeWidth={1}
              />
            );
          })}
          
          {/* Angle labels */}
          {[0, 30, 45, 60, 90, 120, 135, 150, 180].map(angle => {
            const { x, y } = polarToSVG(angle, maxRadius + 0.5);
            return (
              <text
                key={angle}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fill="#666"
              >
                {angle}°
              </text>
            );
          })}
          
          {/* Radius labels */}
          {gridCircles.filter(radius => radius > 0).map(radius => (
            <text
              key={radius}
              x={centerX + 5}
              y={centerY - (radius / maxRadius) * chartRadius}
              fontSize="12"
              fill="#666"
            >
              {radius}
            </text>
          ))}
          
          {/* Wind speed curves */}
          {selectedData.map((windData, index) => {
            const isBeingEdited = windData.windSpeed === editingWindSpeed;
            const stroke = isBeingEdited ? '#ff0000' : colors[index % colors.length];
            const path = generatePath(windData);
            
            return (
              <g key={windData.windSpeed}>
                <path
                  d={path}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={isBeingEdited ? 3 : 2}
                />
                
                {/* Anchor points for editing wind speed */}
                {isBeingEdited && windData.anchorPoints.map(point => {
                  if (point.angle < 0 || point.angle > 180) return null;
                  const { x, y } = polarToSVG(point.angle, point.boatSpeed);
                  return (
                    <circle
                      key={point.angle}
                      cx={x}
                      cy={y}
                      r={4}
                      fill={stroke}
                      stroke="white"
                      strokeWidth={2}
                      style={{ cursor: 'move' }}
                      className="draggable-anchor"
                      onMouseEnter={(e) => {
                        setTooltip({
                          visible: true,
                          x: e.clientX + 10,
                          y: e.clientY - 10,
                          content: `${point.angle}°: ${point.boatSpeed.toFixed(1)} knots`
                        });
                      }}
                      onMouseLeave={() => {
                        setTooltip({ ...tooltip, visible: false });
                      }}
                    />
                  );
                })}
              </g>
            );
          })}
          
          {/* Parquet data scatter points */}
          {parquetData.map((point, index) => {
            if (point.twa < 0 || point.twa > 180) return null;
            const { x, y } = polarToSVG(point.twa, point.bsp);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={2}
                fill="rgba(255, 0, 0, 0.6)"
                stroke="rgba(255, 255, 255, 0.8)"
                strokeWidth={0.5}
              />
            );
          })}
        </svg>
      </div>
      
      {/* Tooltip */}
      {tooltip.visible && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            backgroundColor: 'white',
            padding: '5px 10px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}
        >
          {tooltip.content}
        </div>
      )}
      
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <p>Angle (degrees) vs Boat Speed (knots)</p>
      </div>
    </div>
  );
};

export default LinePolarChart;
