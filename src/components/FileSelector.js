import React, { useState, useEffect, useRef } from 'react';
import './FileSelector.css';

const FileSelector = ({ onFileLoad, onDownloadPolarFile }) => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
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

  return (
    <div className="file-selector">
      <h2>Polar Data Files</h2>
      
      {loading && <p>Loading...</p>}
      {error && <p className="error">Error: {error}</p>}
      
      <div className="file-select-container">
        <select 
          value={selectedFile} 
          onChange={handleFileSelect}
          disabled={loading || files.length === 0}
        >
          <option value="">Select a file...</option>
          {files.map(file => (
            <option key={file} value={file}>{file}</option>
          ))}
        </select>
        
        <button 
          onClick={handleLoadFile}
          disabled={!selectedFile || loading}
        >
          Load File
        </button>
        
        <button 
          onClick={() => onDownloadPolarFile()}
          className="download-button"
          title="Download current data as a polar file"
        >
          Download
        </button>
      </div>
      
      <div 
        className={`drop-zone ${isDragging ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <div className="drop-zone-content">
          <p>Drag & drop a polar file here</p>
          <p>or</p>
          <button className="browse-button">Browse Files</button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileInputChange} 
            accept=".pol,.txt"
            style={{ display: 'none' }}
          />
        </div>
      </div>
      
      <p className="file-info">
        Polar files are tab-separated with wind speed in the first column, 
        followed by alternating columns of wind angle and boat speed.
        Lines starting with ! are treated as comments and ignored.
      </p>
    </div>
  );
};

export default FileSelector;
