import React from 'react';
import { 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer, 
  PolarChart as RechartsPolarchart,
  Radar,
  Tooltip
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{
        backgroundColor: 'white',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '5px'
      }}>
        <p>{`Angle: ${payload[0].payload.angle}°`}</p>
        <p>{`Boat Speed: ${payload[0].value} knots`}</p>
      </div>
    );
  }
  return null;
};

const PolarChart = ({ data, windSpeed }) => {
  // Transform data for Recharts
  const chartData = data.map(item => ({
    angle: item.angle,
    boatSpeed: item.boatSpeed,
  }));
  
  // Find max boat speed for setting the domain
  const maxBoatSpeed = Math.max(...data.map(item => item.boatSpeed)) || 10;
  const domain = [0, Math.ceil(maxBoatSpeed * 1.2)]; // Add 20% margin
  
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <h2>Polar Chart for {windSpeed} knots Wind Speed</h2>
      <ResponsiveContainer width="100%" height="80%">
        <RechartsPolarchart>
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
            angle={90}
            domain={domain}
            tickCount={6}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}`}
          />
          <Radar
            name="Boat Speed"
            dataKey="boatSpeed"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
            data={chartData}
            isAnimationActive={true}
          />
          <Tooltip content={<CustomTooltip />} />
        </RechartsPolarchart>
      </ResponsiveContainer>
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <p>Angle (degrees) vs Boat Speed (knots)</p>
      </div>
    </div>
  );
};

export default PolarChart;
