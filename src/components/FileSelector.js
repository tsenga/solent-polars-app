import React, { useState, useEffect, useRef } from 'react';
import './FileSelector.css';
import { 
  Paper, Typography, Button, Box, CircularProgress,
  Alert, Divider, List, ListItem, ListItemButton, ListItemText, Grid
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import * as d3 from 'd3';

const FileSelector = ({ onFileLoad, onDownloadPolarFile }) => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const fileInputRef = useRef(null);
  const previewSvgRef = useRef(null);

  // Fetch available files from the data directory
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/files');
        if (!response.ok) {
          throw new Error('Failed to fetch files');
        }
        const data = await response.json();
        setFiles(data.files || []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const handleFileSelect = (fileName) => {
    setSelectedFile(fileName);
    // Load preview data when file is selected
    loadPreviewData(fileName);
  };

  const loadPreviewData = async (fileName) => {
    if (!fileName) {
      setPreviewData(null);
      return;
    }

    try {
      const response = await fetch(`/api/files/${fileName}`);
      if (!response.ok) {
        throw new Error('Failed to load preview');
      }
      const data = await response.json();
      setPreviewData(data.polarData);
    } catch (err) {
      console.error('Failed to load preview:', err);
      setPreviewData(null);
    }
  };

  const handleLoadFile = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/files/${selectedFile}`);
      if (!response.ok) {
        throw new Error('Failed to load file');
      }
      const data = await response.json();
      onFileLoad(data.polarData);
      setLoading(false);
      // Close the drawer after successful file load
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Handle file upload from drag and drop or file input
  const handleFileUpload = (file) => {
    if (!file) return;
    
    // Check if file is a text file
    if (!file.name.endsWith('.pol') && !file.name.endsWith('.txt')) {
      setError('Please upload a .pol or .txt file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setLoading(true);
        const fileContent = e.target.result;
        
        // Parse the file content
        const parsedData = parsePolarFile(fileContent);
        setPreviewData(parsedData);
        onFileLoad(parsedData);
        setLoading(false);
      } catch (err) {
        setError(`Failed to parse file: ${err.message}`);
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read file');
      setLoading(false);
    };
    
    reader.readAsText(file);
  };
  
  // Parse polar file content (copied from server.js for client-side parsing)
  const parsePolarFile = (fileContent) => {
    const lines = fileContent.trim().split('\n');
    const polarData = [];
    
    lines.forEach(line => {
      // Skip comment lines that start with !
      if (line.trim().startsWith('!')) {
        return;
      }
      
      const values = line.trim().split(/\s+/); // Split by whitespace (tabs or spaces)
      
      if (values.length < 3 || values.length % 2 === 0) {
        throw new Error('Invalid polar file format. Each line should have wind speed followed by pairs of angle and boat speed.');
      }
      
      const windSpeed = parseFloat(values[0]);
      const anchorPoints = [];
      
      // Process pairs of angle and boat speed
      for (let i = 1; i < values.length; i += 2) {
        const angle = parseFloat(values[i]);
        const boatSpeed = parseFloat(values[i + 1]);
        
        if (isNaN(angle) || isNaN(boatSpeed)) {
          throw new Error('Invalid numeric values in polar file');
        }
        
        anchorPoints.push({ angle, boatSpeed });
      }
      
      // Sort anchor points by angle
      anchorPoints.sort((a, b) => a.angle - b.angle);
      
      polarData.push({ windSpeed, anchorPoints });
    });
    
    // Sort by wind speed
    polarData.sort((a, b) => a.windSpeed - b.windSpeed);
    
    return polarData;
  };
  
  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };
  
  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };
  
  // Trigger file input click
  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  // Polar preview chart component
  const PolarPreview = ({ data }) => {
    useEffect(() => {
      if (!data || !previewSvgRef.current) return;

      // Clear previous chart
      d3.select(previewSvgRef.current).selectAll('*').remove();

      // Set up dimensions
      const width = 300;
      const height = 300;
      const margin = { top: 20, right: 20, bottom: 20, left: 20 };
      const radius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2;
      
      // Create SVG
      const svg = d3.select(previewSvgRef.current)
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);
      
      // Find max boat speed for scaling
      const maxBoatSpeed = d3.max(data, windData => 
        d3.max(windData.anchorPoints, d => d.boatSpeed)
      ) || 10;
      
      // Round up to next full BSP for grid circles
      const maxRadius = Math.ceil(maxBoatSpeed);
      
      // Scale for radius (boat speed)
      const rScale = d3.scaleLinear()
        .domain([0, maxRadius])
        .range([0, radius]);
      
      // Scale for angles (0 at top, 180 at bottom, only right half)
      const angleScale = d3.scaleLinear()
        .domain([0, 180])
        .range([Math.PI * 0, Math.PI * 1]);
      
      // Create grid circles
      const gridCircles = Array.from({ length: maxRadius + 1 }, (_, i) => i);
      svg.selectAll('.grid-circle')
        .data(gridCircles)
        .enter()
        .append('circle')
        .attr('class', 'grid-circle')
        .attr('r', d => rScale(d))
        .attr('fill', 'none')
        .attr('stroke', d => d === 0 ? 'none' : '#ddd')
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
        .attr('y', d => -(radius + 10) * Math.cos(angleScale(d)))
        .attr('x', d => (radius + 10) * Math.sin(angleScale(d)))
        .attr('text-anchor', d => d < 90 ? 'start' : (d > 90 ? 'end' : 'middle'))
        .attr('dominant-baseline', d => d === 0 ? 'text-before-edge' : (d === 180 ? 'text-after-edge' : 'middle'))
        .attr('font-size', '10px')
        .text(d => `${d}°`);
      
      // Create line generator
      const lineGenerator = d3.lineRadial()
        .angle(d => angleScale(d.angle))
        .radius(d => rScale(d.boatSpeed))
        .curve(d3.curveCardinal);
      
      // Colors for different wind speeds
      const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28'];
      
      // Draw lines for each wind speed
      data.forEach((windData, index) => {
        const color = colors[index % colors.length];
        
        // Sort anchor points by angle
        const sortedPoints = [...windData.anchorPoints].sort((a, b) => a.angle - b.angle);
        
        // Draw the line
        svg.append('path')
          .datum(sortedPoints)
          .attr('class', 'line')
          .attr('d', lineGenerator)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 2);
      });
      
      // Add legend
      const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${-radius + 10}, ${-radius + 10})`);
      
      data.forEach((windData, index) => {
        const color = colors[index % colors.length];
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${index * 15})`);
        
        legendItem.append('line')
          .attr('x1', 0)
          .attr('x2', 15)
          .attr('y1', 0)
          .attr('y2', 0)
          .attr('stroke', color)
          .attr('stroke-width', 2);
        
        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 0)
          .attr('dy', '0.35em')
          .attr('font-size', '10px')
          .text(`${windData.windSpeed} kts`);
      });
      
    }, [data]);

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg ref={previewSvgRef} style={{ border: '1px solid #ddd', borderRadius: '4px' }}></svg>
      </Box>
    );
  };

  return (
    <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden' }}>      
      <Box sx={{ p: 2 }}>
        {loading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />}
        {error && <Alert severity="error" sx={{ mb: 2 }}>Error: {error}</Alert>}
        
        <Grid container spacing={2}>
          {/* Left side - File selection */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button 
                variant="contained"
                onClick={handleLoadFile}
                disabled={!selectedFile || loading}
                sx={{ minWidth: '100px' }}
              >
                Load
              </Button>
              
              <Button 
                variant="contained"
                color="success"
                onClick={() => onDownloadPolarFile()}
                title="Download current data as a polar file"
                sx={{ minWidth: '100px' }}
              >
                Download
              </Button>
            </Box>
            
            {/* File List */}
            <Typography variant="h6" sx={{ mb: 1 }}>
              Available Files
            </Typography>
            <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
              <List dense>
                {files.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="No files available" />
                  </ListItem>
                ) : (
                  files.map(file => (
                    <ListItem key={file} disablePadding>
                      <ListItemButton
                        selected={selectedFile === file}
                        onClick={() => handleFileSelect(file)}
                      >
                        <ListItemText primary={file} />
                      </ListItemButton>
                    </ListItem>
                  ))
                )}
              </List>
            </Paper>
            
            {/* Drop zone - reduced width */}
            <Box 
              sx={{ 
                border: '2px dashed',
                borderColor: isDragging ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 2,
                textAlign: 'center',
                bgcolor: isDragging ? 'primary.lighter' : 'background.paper',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                mb: 2
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <CloudUpload sx={{ fontSize: 30, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Drag & drop a polar file here
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  or
                </Typography>
                <Button variant="contained" component="span" size="small">
                  Browse Files
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileInputChange} 
                  accept=".pol,.txt"
                  style={{ display: 'none' }}
                />
              </Box>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
              Polar files are tab-separated with wind speed in the first column, 
              followed by alternating columns of wind angle and boat speed.
              Lines starting with ! are treated as comments and ignored.
            </Typography>
          </Grid>
          
          {/* Right side - Polar preview */}
          <Grid item xs={12} md={8}>
            {previewData ? (
              <PolarPreview data={previewData} />
            ) : (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: 340,
                border: '1px dashed #ddd',
                borderRadius: 1,
                color: 'text.secondary'
              }}>
                <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                  Polar Preview
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default FileSelector;
