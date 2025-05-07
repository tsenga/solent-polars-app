import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './LinePolarChart.css';

const LinePolarChart = ({ polarData, selectedWindSpeeds, editingWindSpeed }) => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);

  // Find all data for selected wind speeds
  const selectedData = polarData.filter(data => 
    selectedWindSpeeds.includes(data.windSpeed)
  );

  useEffect(() => {
    if (!selectedData.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Set up dimensions
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const radius = Math.min(innerWidth, innerHeight) / 2;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
    // Find max boat speed for scaling
    const maxBoatSpeed = d3.max(selectedData, windData => 
      d3.max(windData.anchorPoints, d => d.boatSpeed)
    ) || 10;
    
    // Scale for radius (boat speed)
    const rScale = d3.scaleLinear()
      .domain([0, maxBoatSpeed * 1.2]) // Add 20% margin
      .range([0, radius]);
    
    // Scale for angles (0 at top, 180 at bottom, only right half)
    const angleScale = d3.scaleLinear()
      .domain([0, 180])
      .range([Math.PI * 0, Math.PI * 1]); // Start at top (0°), end at bottom (180°) - right side only
    
    // Create grid circles
    const gridCircles = [0, 0.25, 0.5, 0.75, 1];
    svg.selectAll('.grid-circle')
      .data(gridCircles)
      .enter()
      .append('circle')
      .attr('class', 'grid-circle')
      .attr('r', d => rScale(d * maxBoatSpeed * 1.2))
      .attr('fill', 'none')
      .attr('stroke', '#ddd')
      .attr('stroke-dasharray', '3,3');
    
    // Create grid lines for angles
    const gridAngles = [0, 30, 60, 90, 120, 150, 180];
    svg.selectAll('.grid-line')
      .data(gridAngles)
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('y2', d => -radius * Math.cos(angleScale(d)))
      .attr('x2', d => radius * Math.sin(angleScale(d)))
      .attr('stroke', '#ddd')
      .attr('stroke-dasharray', '3,3');
    
    // Add angle labels
    svg.selectAll('.angle-label')
      .data(gridAngles)
      .enter()
      .append('text')
      .attr('class', 'angle-label')
      .attr('y', d => -(radius + 15) * Math.cos(angleScale(d)))
      .attr('x', d => (radius + 15) * Math.sin(angleScale(d)))
      .attr('text-anchor', d => d < 90 ? 'start' : (d > 90 ? 'end' : 'middle'))
      .attr('dominant-baseline', d => d === 0 ? 'text-before-edge' : (d === 180 ? 'text-after-edge' : 'middle'))
      .attr('font-size', '12px')
      .text(d => `${d}°`);
    
    // Add radius labels (boat speed)
    const radiusLabels = [0, maxBoatSpeed * 0.3, maxBoatSpeed * 0.6, maxBoatSpeed * 0.9, maxBoatSpeed * 1.2];
    svg.selectAll('.radius-label')
      .data(radiusLabels)
      .enter()
      .append('text')
      .attr('class', 'radius-label')
      .attr('x', d => rScale(d) * 0.05) // Position slightly to the right of center
      .attr('y', d => -rScale(d) * 0.05) // Position slightly above center
      .attr('text-anchor', 'start')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '10px')
      .text(d => d.toFixed(1));
    
    // Create line generator
    const lineGenerator = d3.lineRadial()
      .angle(d => angleScale(d.angle))
      .radius(d => rScale(d.boatSpeed))
      .curve(d3.curveCardinal);
    
    // Create tooltip
    const tooltip = d3.select(tooltipRef.current)
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'white')
      .style('border', '1px solid #ccc')
      .style('border-radius', '5px')
      .style('padding', '10px')
      .style('box-shadow', '0 2px 5px rgba(0,0,0,0.2)')
      .style('z-index', '1000');
    
    // Draw lines for each wind speed
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28'];
    
    selectedData.forEach((windData, index) => {
      const isBeingEdited = windData.windSpeed === editingWindSpeed;
      const color = isBeingEdited ? '#ff0000' : colors[index % colors.length];
      
      // Sort anchor points by angle
      const sortedPoints = [...windData.anchorPoints].sort((a, b) => a.angle - b.angle);
      
      // Draw the line
      svg.append('path')
        .datum(sortedPoints)
        .attr('class', 'line')
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', isBeingEdited ? 3 : 2);
      
      // Add dots for anchor points
      if (isBeingEdited) {
        svg.selectAll(`.dot-${windData.windSpeed}`)
          .data(sortedPoints)
          .enter()
          .append('circle')
          .attr('class', `dot-${windData.windSpeed}`)
          .attr('cx', d => rScale(d.boatSpeed) * Math.sin(angleScale(d.angle)))
          .attr('cy', d => -rScale(d.boatSpeed) * Math.cos(angleScale(d.angle)))
          .attr('r', 4)
          .attr('fill', color)
          .attr('stroke', 'white')
          .attr('stroke-width', 1)
          .on('mouseover', function(event, d) {
            d3.select(this)
              .attr('r', 6);
            
            tooltip
              .style('visibility', 'visible')
              .html(`<strong>Angle:</strong> ${d.angle.toFixed(2)}°<br>
                     <strong>Boat Speed:</strong> ${d.boatSpeed.toFixed(2)} knots<br>
                     <strong>Wind Speed:</strong> ${windData.windSpeed} knots (editing)`)
              .style('left', `${event.pageX + 10}px`)
              .style('top', `${event.pageY - 28}px`);
          })
          .on('mouseout', function() {
            d3.select(this)
              .attr('r', 4);
            
            tooltip
              .style('visibility', 'hidden');
          });
      }
      
      // Add wind speed label
      svg.append('text')
        .attr('x', rScale(sortedPoints[sortedPoints.length - 1].boatSpeed) * Math.cos(angleScale(sortedPoints[sortedPoints.length - 1].angle)) + 10)
        .attr('y', rScale(sortedPoints[sortedPoints.length - 1].boatSpeed) * Math.sin(angleScale(sortedPoints[sortedPoints.length - 1].angle)))
        .attr('text-anchor', 'start')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', isBeingEdited ? 'bold' : 'normal')
        .attr('fill', color)
        .text(`${windData.windSpeed} knots${isBeingEdited ? ' (editing)' : ''}`);
    });
    
  }, [selectedData, editingWindSpeed]);

  return (
    <div className="line-polar-chart">
      <h2>D3 Polar Chart for Selected Wind Speeds</h2>
      <div className="chart-container">
        <svg ref={svgRef} width="100%" height="100%"></svg>
        <div ref={tooltipRef} className="tooltip"></div>
      </div>
      <div className="chart-footer">
        <p>Angle (degrees) vs Boat Speed (knots)</p>
      </div>
    </div>
  );
};

export default LinePolarChart;
