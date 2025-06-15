const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const AWS = require('aws-sdk');
const parquet = require('parquetjs');

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
    
    // Download parquet file from S3
    const params = {
      Bucket: 'sailing-tseng',
      Key: 'quailo/exp_logs.parquet'
    };
    
    const s3Object = await s3.getObject(params).promise();
    
    // Write to temporary file
    const tempFilePath = path.join(__dirname, 'temp_data.parquet');
    fs.writeFileSync(tempFilePath, s3Object.Body);
    
    // Read parquet file
    const reader = await parquet.ParquetReader.openFile(tempFilePath);
    const cursor = reader.getCursor();
    
    const filteredData = [];
    let record = null;
    
    while (record = await cursor.next()) {
      // Extract required fields
      const { bsp, twa, tws, timestamp } = record;
      
      // Skip records with missing required data
      if (bsp == null || twa == null || tws == null) continue;
      
      // Apply time filter if provided
      if (startTime && endTime) {
        const recordTime = new Date(timestamp);
        if (recordTime < new Date(startTime) || recordTime > new Date(endTime)) {
          continue;
        }
      }
      
      // Apply TWS band filter if provided
      if (twsBands && twsBands.length > 0) {
        // Find the closest TWS band
        const closestBand = twsBands.reduce((closest, band) => {
          const currentDiff = Math.abs(tws - band);
          const closestDiff = Math.abs(tws - closest);
          return currentDiff < closestDiff ? band : closest;
        });
        
        // Only include if within reasonable range of the band (±2.5 knots)
        if (Math.abs(tws - closestBand) > 2.5) {
          continue;
        }
      }
      
      filteredData.push({
        bsp: parseFloat(bsp),
        twa: parseFloat(twa),
        tws: parseFloat(tws),
        timestamp: timestamp
      });
    }
    
    await reader.close();
    
    // Clean up temp file
    fs.unlinkSync(tempFilePath);
    
    console.log(`Returning ${filteredData.length} filtered records`);
    res.json({ data: filteredData });
    
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
