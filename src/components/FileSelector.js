import React, { useState, useEffect } from 'react';
import './FileSelector.css';

const FileSelector = ({ onFileLoad }) => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
