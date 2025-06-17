const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const duckdb = require('duckdb');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// Configure AWS SDK v3
const s3Client = new S3Client({
  region: 'eu-west-2' // Update this to match your S3 bucket region
});

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

// API endpoint to get race details
app.get('/api/race-details', (req, res) => {
  const raceDetailsPath = path.join(__dirname, '..', 'data', 'race-details.json');
  
  // Create data directory if it doesn't exist
  const dataDir = path.dirname(raceDetailsPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Create empty race details file if it doesn't exist
  if (!fs.existsSync(raceDetailsPath)) {
    const initialData = { races: [] };
    fs.writeFileSync(raceDetailsPath, JSON.stringify(initialData, null, 2));
  }
  
  fs.readFile(raceDetailsPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading race details:', err);
      return res.status(500).json({ error: 'Failed to read race details' });
    }
    
    try {
      const raceDetails = JSON.parse(data);
      res.json(raceDetails);
    } catch (parseErr) {
      console.error('Error parsing race details:', parseErr);
      res.status(500).json({ error: 'Failed to parse race details' });
    }
  });
});

// API endpoint to save race details
app.post('/api/race-details', (req, res) => {
  const raceDetailsPath = path.join(__dirname, '..', 'data', 'race-details.json');
  const raceDetails = req.body;
  
  // Create data directory if it doesn't exist
  const dataDir = path.dirname(raceDetailsPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFile(raceDetailsPath, JSON.stringify(raceDetails, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('Error saving race details:', err);
      return res.status(500).json({ error: 'Failed to save race details' });
    }
    
    res.json({ success: true });
  });
});

// API endpoint to get parquet data with filtering
app.post('/api/parquet-data', async (req, res) => {
  try {
    const { startTime, endTime, maxTws, useMockData = true } = req.body;
    
    console.log('Fetching parquet data with filters:', { startTime, endTime, maxTws, useMockData });
    
    if (useMockData) {
      // Generate mock data
      const mockData = [];
      
      // Generate sample data points for testing
      for (let i = 0; i < 200; i++) {
        const twa = Math.random() * 180; // Random angle 0-180
        const bsp = Math.random() * 8 + 2; // Random boat speed 2-10 knots
        const tws = Math.random() * 20 + 5; // Random TWS 5-25 knots
        
        // Apply max TWS filter if provided
        if (maxTws && tws > maxTws) {
          continue;
        }
        
        mockData.push({
          bsp: parseFloat(bsp.toFixed(2)),
          twa: parseFloat(twa.toFixed(1)),
          tws: parseFloat(tws.toFixed(1)),
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString() // Random time in last 24h
        });
      }
      
      console.log(`Returning ${mockData.length} mock records`);
      res.json({ data: mockData });
    } else {
      // Fetch real parquet data from S3
      console.log('Attempting to fetch real parquet data from S3...');
      
      try {
        console.log('Using DuckDB to query parquet file from S3...');
        
        // Create a new DuckDB database instance
        const db = new duckdb.Database(':memory:');
        
        // Create a promise wrapper for DuckDB operations
        const queryAsync = (query) => {
          return new Promise((resolve, reject) => {
            db.all(query, (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            });
          });
        };
        
        // Install and load httpfs extension for S3 access
        await queryAsync("INSTALL httpfs;");
        await queryAsync("LOAD httpfs;");
        
        // Configure S3 credentials for DuckDB
        // Set AWS credentials from environment variables or use default profile
        const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        const awsRegion = process.env.AWS_DEFAULT_REGION || 'eu-west-2';
        
        if (awsAccessKeyId && awsSecretAccessKey) {
          await queryAsync(`SET s3_access_key_id='${awsAccessKeyId}';`);
          await queryAsync(`SET s3_secret_access_key='${awsSecretAccessKey}';`);
        }
        await queryAsync(`SET s3_region='${awsRegion}';`);
        
        // Enable S3 path style access (sometimes needed for certain S3 configurations)
        await queryAsync("SET s3_use_ssl=true;");
        await queryAsync("SET s3_url_style='path';");
        await queryAsync("SET http_keep_alive=false;");

        await queryAsync(`
          CREATE SECRET (
            TYPE s3,
            PROVIDER credential_chain
          );
          `);

        console.log(`AWS access_key_id=${awsAccessKeyId} secret_access_key=${awsSecretAccessKey} region=${awsRegion}`)
        
        // Build the SQL query with filters
        let sqlQuery = `
          SELECT bsp, twa, tws, utc
          FROM read_parquet('s3://sailing-tseng/quailo/exp_logs.parquet')
          WHERE bsp IS NOT NULL 
            AND twa IS NOT NULL 
            AND tws IS NOT NULL
        `;
        
        // Add time filter if provided
        if (startTime && endTime) {
          sqlQuery += ` AND utc >= '${startTime}' AND utc <= '${endTime}'`;
        }
        
        // Add max TWS filter if provided
        if (maxTws) {
          sqlQuery += ` AND tws <= ${maxTws}`;
        }
        
        console.log('Executing DuckDB query:', sqlQuery);
        
        // Execute the query
        const rows = await queryAsync(sqlQuery);
        
        console.log(`DuckDB returned ${rows.length} rows`);
        
        // Convert to the expected format
        const records = rows.map(row => ({
          bsp: parseFloat(row.bsp),
          twa: parseFloat(row.twa),
          tws: parseFloat(row.tws),
          timestamp: row.utc || new Date().toISOString()
        }));
        
        // Close the database connection
        db.close();
        
        console.log(`Returning ${records.length} filtered records from parquet file`);
        res.json({ data: records });
        
      } catch (s3Error) {
        console.error('Error fetching real parquet data:', s3Error);
        res.status(500).json({ 
          error: 'Failed to fetch real parquet data: ' + s3Error.message,
          suggestion: 'Try using mock data mode instead.'
        });
        return;
      }
    }
    
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
