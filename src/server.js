const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const AWS = require('aws-sdk');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// Configure AWS SDK
AWS.config.update({
  region: 'us-east-1' // Update this to match your S3 bucket region
});

const s3 = new AWS.S3();

// API endpoint to get list of files in the data directory
app.get('/api/files', (req, res) => {
  const dataDir = path.join(__dirname, '..', 'data');
  
  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.readdir(dataDir, (err, files) => {
    if (err) {
      console.error('Error reading data directory:', err);
      return res.status(500).json({ error: 'Failed to read data directory' });
    }
    
    // Filter for .txt or .pol files
    const polarFiles = files.filter(file => 
      file.endsWith('.txt') || file.endsWith('.pol')
    );
    
    res.json({ files: polarFiles });
  });
});

// API endpoint to get content of a specific file
app.get('/api/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '..', 'data', filename);
  
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file ${filename}:`, err);
      return res.status(500).json({ error: `Failed to read file ${filename}` });
    }
    
    try {
      // Parse the polar file
      const polarData = parsePolarFile(data);
      res.json({ polarData });
    } catch (parseErr) {
      console.error(`Error parsing file ${filename}:`, parseErr);
      res.status(400).json({ error: `Failed to parse file: ${parseErr.message}` });
    }
  });
});

// API endpoint to get parquet data with filtering
app.post('/api/parquet-data', async (req, res) => {
  try {
    const { startTime, endTime, twsBands } = req.body;
    
    console.log('Fetching parquet data with filters:', { startTime, endTime, twsBands });
    
    // For now, return mock data until we can properly handle the parquet file
    // This allows the UI to work while we resolve the parquet reading issue
    const mockData = [];
    
    // Generate some sample data points for testing
    if (twsBands && twsBands.length > 0) {
      const selectedTws = twsBands[0]; // Use first TWS band for mock data
      
      // Generate sample points around the selected TWS
      for (let i = 0; i < 50; i++) {
        const twa = Math.random() * 180; // Random angle 0-180
        const bsp = Math.random() * 8 + 2; // Random boat speed 2-10 knots
        const tws = selectedTws + (Math.random() - 0.5) * 4; // TWS ±2 knots around selected
        
        mockData.push({
          bsp: parseFloat(bsp.toFixed(2)),
          twa: parseFloat(twa.toFixed(1)),
          tws: parseFloat(tws.toFixed(1)),
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString() // Random time in last 24h
        });
      }
    }
    
    console.log(`Returning ${mockData.length} mock records`);
    res.json({ data: mockData });
    
  } catch (error) {
    console.error('Error fetching parquet data:', error);
    res.status(500).json({ error: 'Failed to fetch parquet data: ' + error.message });
  }
});

// Function to parse polar file content
function parsePolarFile(fileContent) {
  const lines = fileContent.trim().split('\n');
  const polarData = [];
  
  lines.forEach(line => {
    // Skip comment lines that start with !
    if (line.trim().startsWith('!')) {
      return;
    }
    
    const values = line.trim().split(/\s+/); // Split by whitespace (tabs or spaces)
    
    if (values.length < 3 || values.length % 2 === 0) {
      throw new Error('Invalid polar file format. Each line should have wind speed followed by pairs of boat speed and angle.');
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
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
