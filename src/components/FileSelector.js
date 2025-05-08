import React, { useState, useEffect, useRef } from 'react';
import './FileSelector.css';
import { 
  Paper, Typography, Select, MenuItem, Button, 
  FormControl, InputLabel, Box, CircularProgress,
  Alert, Collapse, IconButton, Divider
} from '@mui/material';
import { ExpandMore, ExpandLess, CloudUpload } from '@mui/icons-material';

const FileSelector = ({ onFileLoad, onDownloadPolarFile }) => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const fileInputRef = useRef(null);

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

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.value);
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
      setIsDrawerOpen(false);
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
        onFileLoad(parsedData);
        setLoading(false);
        // Close the drawer after successful file load
        setIsDrawerOpen(false);
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

  // Toggle drawer open/closed
  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  return (
    <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 2,
          cursor: 'pointer',
          bgcolor: 'background.paper',
          borderBottom: isDrawerOpen ? 1 : 0,
          borderColor: 'divider'
        }}
        onClick={toggleDrawer}
      >
        <Typography variant="h6" component="h2">Polar Data Files</Typography>
        <IconButton size="small">
          {isDrawerOpen ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      
      <Collapse in={isDrawerOpen}>
        <Box sx={{ p: 2 }}>
          {loading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />}
          {error && <Alert severity="error" sx={{ mb: 2 }}>Error: {error}</Alert>}
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="file-select-label">Select a file</InputLabel>
              <Select
                labelId="file-select-label"
                value={selectedFile}
                label="Select a file"
                onChange={handleFileSelect}
                disabled={loading || files.length === 0}
              >
                <MenuItem value="">
                  <em>Select a file...</em>
                </MenuItem>
                {files.map(file => (
                  <MenuItem key={file} value={file}>{file}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
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
          
          <Box 
            sx={{ 
              border: '2px dashed',
              borderColor: isDragging ? 'primary.main' : 'divider',
              borderRadius: 2,
              p: 3,
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
              <CloudUpload sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" color="text.secondary">
                Drag & drop a polar file here
              </Typography>
              <Typography variant="body2" color="text.secondary">
                or
              </Typography>
              <Button variant="contained" component="span">
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
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Polar files are tab-separated with wind speed in the first column, 
            followed by alternating columns of wind angle and boat speed.
            Lines starting with ! are treated as comments and ignored.
          </Typography>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default FileSelector;
