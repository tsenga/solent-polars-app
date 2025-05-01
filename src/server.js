const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

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
    
    // Process pairs of boat speed and angle
    for (let i = 1; i < values.length; i += 2) {
      const boatSpeed = parseFloat(values[i]);
      const angle = parseFloat(values[i + 1]);
      
      if (isNaN(boatSpeed) || isNaN(angle)) {
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
