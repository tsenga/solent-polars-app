import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectSelectedWindSpeeds, selectPolarData } from '../store/polarDataSlice';
import * as d3 from 'd3';

// Define colors array for consistency with LinePolarChart
const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28'];

const PolarAnalysisChart = ({ 
  editingWindSpeed, 
  selectedWindSpeeds,
  onSelectWindSpeed
}) => {
  const polarData = useSelector(selectPolarData);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);

  // Find data for the editing wind speed only
  const selectedData = polarData.filter(data => 
    data.windSpeed === editingWindSpeed
  );

  useEffect(() => {
    if (!selectedData.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Set up dimensions (increased right margin for second derivative axis)
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const margin = { top: 20, right: 100, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Find max boat speed for scaling
    const maxBoatSpeed = d3.max(selectedData, windData => 
      d3.max(windData.anchorPoints, d => d.boatSpeed)
    ) || 10;
    
    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, 180])
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain([0, Math.ceil(maxBoatSpeed)])
      .range([innerHeight, 0]);
    
    // Create axes
    const xAxis = d3.axisBottom(xScale)
      .tickValues([0, 30, 60, 90, 120, 150, 180])
      .tickFormat(d => `${d}°`);
    
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => `${d} kts`);
    
    // Add axes
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis);
    
    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis);
    
    // Add axis labels
    g.append('text')
      .attr('class', 'x-axis-label')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('True Wind Angle (degrees)');
    
    g.append('text')
      .attr('class', 'y-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Boat Speed (knots)');
    
    // Add grid lines
    g.selectAll('.grid-line-x')
      .data(xScale.ticks(6))
      .enter()
      .append('line')
      .attr('class', 'grid-line-x')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#ddd')
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.5);
    
    g.selectAll('.grid-line-y')
      .data(yScale.ticks(5))
      .enter()
      .append('line')
      .attr('class', 'grid-line-y')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#ddd')
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.5);
    
    // Create line generator
    const lineGenerator = d3.line()
      .x(d => xScale(d.angle))
      .y(d => yScale(d.boatSpeed))
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
      .style('z-index', '1000')
      .style('pointer-events', 'none');

    // Draw lines for each wind speed
    selectedData.forEach((windData, index) => {
      const isBeingEdited = windData.windSpeed === editingWindSpeed;
      const color = '#ff0000'; // Always red since we're only showing the editing wind speed
      
      // Sort anchor points by angle
      const sortedPoints = [...windData.anchorPoints].sort((a, b) => a.angle - b.angle);
      
      // Calculate first derivative (rate of change of boat speed with respect to angle)
      const derivativePoints = [];
      for (let i = 1; i < sortedPoints.length; i++) {
        const prevPoint = sortedPoints[i - 1];
        const currPoint = sortedPoints[i];
        const deltaSpeed = currPoint.boatSpeed - prevPoint.boatSpeed;
        const deltaAngle = currPoint.angle - prevPoint.angle;
        const derivative = deltaAngle !== 0 ? deltaSpeed / deltaAngle : 0;
        
        // Use the midpoint angle for the derivative point
        const midAngle = (prevPoint.angle + currPoint.angle) / 2;
        derivativePoints.push({
          angle: midAngle,
          derivative: derivative
        });
      }
      
      // Calculate second derivative (rate of change of first derivative)
      const secondDerivativePoints = [];
      for (let i = 1; i < derivativePoints.length; i++) {
        const prevDerivPoint = derivativePoints[i - 1];
        const currDerivPoint = derivativePoints[i];
        const deltaDerivative = currDerivPoint.derivative - prevDerivPoint.derivative;
        const deltaAngle = currDerivPoint.angle - prevDerivPoint.angle;
        const secondDerivative = deltaAngle !== 0 ? deltaDerivative / deltaAngle : 0;
        
        // Use the midpoint angle for the second derivative point
        const midAngle = (prevDerivPoint.angle + currDerivPoint.angle) / 2;
        secondDerivativePoints.push({
          angle: midAngle,
          secondDerivative: secondDerivative
        });
      }
      
      // Find max absolute derivative for scaling
      const maxDerivative = Math.max(...derivativePoints.map(d => Math.abs(d.derivative)));
      const maxSecondDerivative = secondDerivativePoints.length > 0 ? 
        Math.max(...secondDerivativePoints.map(d => Math.abs(d.secondDerivative))) : 0;
      
      // Create separate scales for derivatives (right y-axis)
      const derivativeScale = d3.scaleLinear()
        .domain([-maxDerivative, maxDerivative])
        .range([innerHeight, 0]);
      
      const secondDerivativeScale = d3.scaleLinear()
        .domain([-maxSecondDerivative, maxSecondDerivative])
        .range([innerHeight, 0]);
      
      // Add right y-axis for first derivative
      const rightAxis = d3.axisRight(derivativeScale)
        .tickFormat(d => `${d.toFixed(2)}`);
      
      g.append('g')
        .attr('class', 'derivative-y-axis')
        .attr('transform', `translate(${innerWidth}, 0)`)
        .call(rightAxis);
      
      // Add far-right y-axis for second derivative
      if (secondDerivativePoints.length > 0) {
        const farRightAxis = d3.axisRight(secondDerivativeScale)
          .tickFormat(d => `${d.toFixed(3)}`);
        
        g.append('g')
          .attr('class', 'second-derivative-y-axis')
          .attr('transform', `translate(${innerWidth + 50}, 0)`)
          .call(farRightAxis);
        
        // Add far-right y-axis label
        g.append('text')
          .attr('class', 'second-derivative-y-axis-label')
          .attr('transform', 'rotate(-90)')
          .attr('x', -innerHeight / 2)
          .attr('y', innerWidth + 90)
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .style('fill', '#cc6600')
          .text('d²BSP/dAngle² (knots/degree²)');
      }
      
      // Add right y-axis label for first derivative
      g.append('text')
        .attr('class', 'derivative-y-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', innerWidth + 40)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#0066cc')
        .text('dBSP/dAngle (knots/degree)');
      
      // Create line generators for derivatives
      const derivativeLineGenerator = d3.line()
        .x(d => xScale(d.angle))
        .y(d => derivativeScale(d.derivative))
        .curve(d3.curveCardinal);
      
      const secondDerivativeLineGenerator = d3.line()
        .x(d => xScale(d.angle))
        .y(d => secondDerivativeScale(d.secondDerivative))
        .curve(d3.curveCardinal);
      
      // Draw the main polar line
      g.append('path')
        .datum(sortedPoints)
        .attr('class', 'line')
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 3);
      
      // Draw the first derivative line
      if (derivativePoints.length > 0) {
        g.append('path')
          .datum(derivativePoints)
          .attr('class', 'derivative-line')
          .attr('d', derivativeLineGenerator)
          .attr('fill', 'none')
          .attr('stroke', '#0066cc')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5');
        
        // Add dots for first derivative points
        g.selectAll('.derivative-dot')
          .data(derivativePoints)
          .enter()
          .append('circle')
          .attr('class', 'derivative-dot')
          .attr('cx', d => xScale(d.angle))
          .attr('cy', d => derivativeScale(d.derivative))
          .attr('r', 3)
          .attr('fill', '#0066cc')
          .attr('stroke', 'white')
          .attr('stroke-width', 1)
          .on('mouseover', function(event, d) {
            d3.select(this).attr('r', 5);
            
            tooltip
              .style('visibility', 'visible')
              .html(`<strong>Angle:</strong> ${d.angle.toFixed(1)}°<br>
                     <strong>1st Derivative:</strong> ${d.derivative.toFixed(3)} knots/degree<br>
                     <strong>Wind Speed:</strong> ${windData.windSpeed} knots`)
              .style('left', `${event.pageX + 10}px`)
              .style('top', `${event.pageY - 28}px`);
          })
          .on('mouseout', function() {
            d3.select(this).attr('r', 3);
            tooltip.style('visibility', 'hidden');
          });
      }
      
      // Draw the second derivative line
      if (secondDerivativePoints.length > 0) {
        g.append('path')
          .datum(secondDerivativePoints)
          .attr('class', 'second-derivative-line')
          .attr('d', secondDerivativeLineGenerator)
          .attr('fill', 'none')
          .attr('stroke', '#cc6600')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '10,5');
        
        // Add dots for second derivative points
        g.selectAll('.second-derivative-dot')
          .data(secondDerivativePoints)
          .enter()
          .append('circle')
          .attr('class', 'second-derivative-dot')
          .attr('cx', d => xScale(d.angle))
          .attr('cy', d => secondDerivativeScale(d.secondDerivative))
          .attr('r', 3)
          .attr('fill', '#cc6600')
          .attr('stroke', 'white')
          .attr('stroke-width', 1)
          .on('mouseover', function(event, d) {
            d3.select(this).attr('r', 5);
            
            tooltip
              .style('visibility', 'visible')
              .html(`<strong>Angle:</strong> ${d.angle.toFixed(1)}°<br>
                     <strong>2nd Derivative:</strong> ${d.secondDerivative.toFixed(4)} knots/degree²<br>
                     <strong>Wind Speed:</strong> ${windData.windSpeed} knots`)
              .style('left', `${event.pageX + 10}px`)
              .style('top', `${event.pageY - 28}px`);
          })
          .on('mouseout', function() {
            d3.select(this).attr('r', 3);
            tooltip.style('visibility', 'hidden');
          });
      }
      
      // Add dots for anchor points
      g.selectAll(`.dot-${windData.windSpeed}`)
        .data(sortedPoints)
        .enter()
        .append('circle')
        .attr('class', `dot-${windData.windSpeed}`)
        .attr('cx', d => xScale(d.angle))
        .attr('cy', d => yScale(d.boatSpeed))
        .attr('r', 5)
        .attr('fill', color)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .on('mouseover', function(event, d) {
          d3.select(this).attr('r', 7);
          
          tooltip
            .style('visibility', 'visible')
            .html(`<strong>Angle:</strong> ${d.angle}°<br>
                   <strong>Boat Speed:</strong> ${d.boatSpeed.toFixed(2)} knots<br>
                   <strong>Wind Speed:</strong> ${windData.windSpeed} knots (editing)`)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 28}px`);
        })
        .on('mouseout', function() {
          d3.select(this).attr('r', 5);
          tooltip.style('visibility', 'hidden');
        });
    });
    
  }, [selectedData, editingWindSpeed]);

  // Simple legend showing only the editing wind speed and derivatives
  const renderLegend = () => {
    if (!editingWindSpeed) return null;
    
    return (
      <div className="chart-legend" style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', gap: '10px' }}>
        <div 
          className="legend-item"
          style={{ 
            padding: '4px 8px',
            borderRadius: '4px',
            border: '2px solid #ff0000',
            margin: '2px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <span 
            className="legend-color" 
            style={{ 
              display: 'inline-block',
              width: '12px',
              height: '12px',
              backgroundColor: '#ff0000',
              marginRight: '6px',
              borderRadius: '2px'
            }}
          ></span>
          <span 
            className="legend-label"
            style={{ 
              fontWeight: 'bold',
              fontSize: '12px'
            }}
          >
            {editingWindSpeed} knots (BSP)
          </span>
        </div>
        
        <div 
          className="legend-item"
          style={{ 
            padding: '4px 8px',
            borderRadius: '4px',
            border: '2px solid #0066cc',
            margin: '2px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <span 
            className="legend-color" 
            style={{ 
              display: 'inline-block',
              width: '12px',
              height: '2px',
              backgroundColor: '#0066cc',
              marginRight: '6px',
              borderRadius: '1px'
            }}
          ></span>
          <span 
            className="legend-label"
            style={{ 
              fontWeight: 'bold',
              fontSize: '12px'
            }}
          >
            1st Derivative (dBSP/dAngle)
          </span>
        </div>
        
        <div 
          className="legend-item"
          style={{ 
            padding: '4px 8px',
            borderRadius: '4px',
            border: '2px solid #cc6600',
            margin: '2px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <span 
            className="legend-color" 
            style={{ 
              display: 'inline-block',
              width: '12px',
              height: '2px',
              backgroundColor: '#cc6600',
              marginRight: '6px',
              borderRadius: '1px'
            }}
          ></span>
          <span 
            className="legend-label"
            style={{ 
              fontWeight: 'bold',
              fontSize: '12px'
            }}
          >
            2nd Derivative (d²BSP/dAngle²)
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="polar-analysis-chart" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
      <h3 style={{ margin: '10px 0' }}>Polar Analysis Chart</h3>
      <div className="chart-container" style={{ width: '90%', height: '300px', position: 'relative' }}>
        <svg ref={svgRef} width="100%" height="100%"></svg>
        <div ref={tooltipRef} className="tooltip"></div>
      </div>
      {renderLegend()}
    </div>
  );
};

export default PolarAnalysisChart;
