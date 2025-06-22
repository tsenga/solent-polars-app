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

// Global DuckDB database instance
let globalDb = null;
let isParquetLoaded = false;

// Initialize DuckDB and load parquet data on startup
async function initializeDatabase() {
  try {
    console.log('Initializing DuckDB database...');
    globalDb = new duckdb.Database(':memory:');
    
    const queryAsync = (query) => {
      return new Promise((resolve, reject) => {
        globalDb.all(query, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };
    
    // Install and load httpfs extension for S3 access
    await queryAsync("INSTALL httpfs;");
    await queryAsync("LOAD httpfs;");
    
    // Configure S3 credentials for DuckDB
    const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const awsRegion = process.env.AWS_DEFAULT_REGION || 'eu-west-2';
    
    if (awsAccessKeyId && awsSecretAccessKey) {
      await queryAsync(`SET s3_access_key_id='${awsAccessKeyId}';`);
      await queryAsync(`SET s3_secret_access_key='${awsSecretAccessKey}';`);
    }
    await queryAsync(`SET s3_region='${awsRegion}';`);
    
    await queryAsync("SET s3_use_ssl=true;");
    await queryAsync("SET s3_url_style='path';");
    await queryAsync("SET http_keep_alive=false;");

    await queryAsync(`
      CREATE SECRET (
        TYPE s3,
        PROVIDER credential_chain
      );
    `);
    
    // Load parquet data into a table
    await loadParquetData();
    
    console.log('DuckDB database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize DuckDB database:', error);
    globalDb = null;
    isParquetLoaded = false;
  }
}

// Function to load parquet data into DuckDB table
async function loadParquetData() {
  try {
    console.log('Loading parquet data into DuckDB table...');
    
    const queryAsync = (query) => {
      return new Promise((resolve, reject) => {
        globalDb.all(query, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };
    
    // Create table from parquet file
    await queryAsync(`
      CREATE OR REPLACE TABLE sailing_data AS 
      SELECT bsp, twa, tws, utc
      FROM read_parquet('s3://sailing-tseng/quailo/exp_logs.parquet')
      WHERE bsp IS NOT NULL 
        AND twa IS NOT NULL 
        AND tws IS NOT NULL
    `);
    
    // Get row count to verify data loaded
    const countResult = await queryAsync('SELECT COUNT(*) as count FROM sailing_data');
    const rowCount = countResult[0]?.count || 0;
    
    console.log(`Successfully loaded ${rowCount} rows into sailing_data table`);
    isParquetLoaded = true;
  } catch (error) {
    console.error('Failed to load parquet data:', error);
    isParquetLoaded = false;
    throw error;
  }
}

// Helper function to execute queries on the global database
function executeQuery(query) {
  return new Promise((resolve, reject) => {
    if (!globalDb) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    globalDb.all(query, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

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

// API endpoint to refresh parquet data
app.post('/api/refresh-parquet-data', async (req, res) => {
  try {
    console.log('Refreshing parquet data...');
    
    if (!globalDb) {
      await initializeDatabase();
    } else {
      await loadParquetData();
    }
    
    res.json({ 
      success: true, 
      message: 'Parquet data refreshed successfully',
      isLoaded: isParquetLoaded
    });
  } catch (error) {
    console.error('Error refreshing parquet data:', error);
    res.status(500).json({ 
      error: 'Failed to refresh parquet data: ' + error.message,
      isLoaded: isParquetLoaded
    });
  }
});

// API endpoint to get parquet data summary with filtering
app.post('/api/parquet-data-summary', async (req, res) => {
  try {
    const { startTime, endTime, minTws, maxTws, useMockData = true, histogramBuckets = 10 } = req.body;
    
    console.log('Fetching parquet data summary with filters:', { startTime, endTime, minTws, maxTws, useMockData, histogramBuckets });
    
    if (useMockData) {
      // Generate mock summary data
      const mockData = [];
      
      // Generate sample data points for analysis
      for (let i = 0; i < 1000; i++) {
        const twa = Math.random() * 180;
        const bsp = Math.random() * 8 + 2;
        const tws = Math.random() * 20 + 5;
        
        // Apply TWS filters if provided
        if (minTws && tws < minTws) {
          continue;
        }
        if (maxTws && tws > maxTws) {
          continue;
        }
        
        mockData.push({
          bsp: parseFloat(bsp.toFixed(2)),
          twa: parseFloat(twa.toFixed(1)),
          tws: parseFloat(tws.toFixed(1)),
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
        });
      }
      
      // Calculate summary statistics
      const summary = calculateDataSummary(mockData, histogramBuckets);
      console.log(`Returning summary for ${mockData.length} mock records`);
      res.json({ summary });
    } else {
      // Use pre-loaded parquet data from DuckDB
      console.log('Fetching real parquet data summary from pre-loaded DuckDB table...');
      
      try {
        if (!globalDb || !isParquetLoaded) {
          throw new Error('Parquet data not loaded. Please refresh the data first.');
        }
        
        // Build the SQL query for summary statistics
        let sqlQuery = `
          SELECT 
            COUNT(*) as total_points,
            MIN(bsp) as min_bsp, MAX(bsp) as max_bsp, AVG(bsp) as avg_bsp,
            MIN(twa) as min_twa, MAX(twa) as max_twa, AVG(twa) as avg_twa,
            MIN(tws) as min_tws, MAX(tws) as max_tws, AVG(tws) as avg_tws,
            MIN(utc) as start_time, MAX(utc) as end_time
          FROM sailing_data
          WHERE 1=1
        `;
        
        // Add time filter if provided
        if (startTime && endTime) {
          const formatTimestamp = (dateTimeLocal) => {
            return dateTimeLocal.replace('T', ' ') + ':00';
          };
          
          const formattedStartTime = formatTimestamp(startTime);
          const formattedEndTime = formatTimestamp(endTime);
          
          sqlQuery += ` AND utc >= '${formattedStartTime}' AND utc <= '${formattedEndTime}'`;
        }
        
        // Add TWS filters if provided
        if (minTws) {
          sqlQuery += ` AND tws >= ${minTws}`;
        }
        if (maxTws) {
          sqlQuery += ` AND tws <= ${maxTws}`;
        }
        
        console.log('Executing DuckDB summary query:', sqlQuery);
        
        const summaryRows = await executeQuery(sqlQuery);
        
        // Get histogram data for distributions with dynamic buckets
        let histogramQuery = `
          WITH data_ranges AS (
            SELECT 
              MIN(tws) as min_tws, MAX(tws) as max_tws,
              MIN(bsp) as min_bsp, MAX(bsp) as max_bsp,
              MIN(ABS(twa)) as min_twa, MAX(ABS(twa)) as max_twa
            FROM sailing_data
            WHERE 1=1
        `;
        
        // Add same filters to the ranges query
        if (startTime && endTime) {
          const formatTimestamp = (dateTimeLocal) => {
            return dateTimeLocal.replace('T', ' ') + ':00';
          };
          
          const formattedStartTime = formatTimestamp(startTime);
          const formattedEndTime = formatTimestamp(endTime);
          
          histogramQuery += ` AND utc >= '${formattedStartTime}' AND utc <= '${formattedEndTime}'`;
        }
        
        if (minTws) {
          histogramQuery += ` AND tws >= ${minTws}`;
        }
        if (maxTws) {
          histogramQuery += ` AND tws <= ${maxTws}`;
        }
        
        histogramQuery += `
          )
          SELECT 
            FLOOR((tws - dr.min_tws) / ((dr.max_tws - dr.min_tws) / ${histogramBuckets})) * ((dr.max_tws - dr.min_tws) / ${histogramBuckets}) + dr.min_tws as tws_bin,
            COUNT(*) as tws_count,
            FLOOR((bsp - dr.min_bsp) / ((dr.max_bsp - dr.min_bsp) / ${histogramBuckets})) * ((dr.max_bsp - dr.min_bsp) / ${histogramBuckets}) + dr.min_bsp as bsp_bin,
            COUNT(*) as bsp_count,
            FLOOR((ABS(twa) - dr.min_twa) / ((dr.max_twa - dr.min_twa) / ${histogramBuckets})) * ((dr.max_twa - dr.min_twa) / ${histogramBuckets}) + dr.min_twa as twa_bin,
            COUNT(*) as twa_count
          FROM sailing_data, data_ranges dr
          WHERE 1=1
        `;
        
        // Add same filters to histogram query
        if (startTime && endTime) {
          const formatTimestamp = (dateTimeLocal) => {
            return dateTimeLocal.replace('T', ' ') + ':00';
          };
          
          const formattedStartTime = formatTimestamp(startTime);
          const formattedEndTime = formatTimestamp(endTime);
          
          histogramQuery += ` AND utc >= '${formattedStartTime}' AND utc <= '${formattedEndTime}'`;
        }
        
        if (minTws) {
          histogramQuery += ` AND tws >= ${minTws}`;
        }
        if (maxTws) {
          histogramQuery += ` AND tws <= ${maxTws}`;
        }
        
        histogramQuery += ` GROUP BY tws_bin, bsp_bin, twa_bin ORDER BY tws_bin, bsp_bin, twa_bin`;
        
        const histogramRows = await executeQuery(histogramQuery);
        
        const summary = {
          totalPoints: Number(summaryRows[0]?.total_points || 0),
          bsp: {
            min: Number(summaryRows[0]?.min_bsp || 0),
            max: Number(summaryRows[0]?.max_bsp || 0),
            avg: Number(summaryRows[0]?.avg_bsp || 0)
          },
          twa: {
            min: Number(summaryRows[0]?.min_twa || 0),
            max: Number(summaryRows[0]?.max_twa || 0),
            avg: Number(summaryRows[0]?.avg_twa || 0)
          },
          tws: {
            min: Number(summaryRows[0]?.min_tws || 0),
            max: Number(summaryRows[0]?.max_tws || 0),
            avg: Number(summaryRows[0]?.avg_tws || 0)
          },
          timeRange: {
            start: summaryRows[0]?.start_time,
            end: summaryRows[0]?.end_time
          },
          histograms: processHistogramData(histogramRows)
        };
        
        console.log(`Returning summary for ${summary.totalPoints} records from parquet file`);
        res.json({ summary });
        
      } catch (s3Error) {
        console.error('Error fetching real parquet data summary:', s3Error);
        res.status(500).json({ 
          error: 'Failed to fetch real parquet data summary: ' + s3Error.message,
          suggestion: 'Try using mock data mode instead.'
        });
        return;
      }
    }
    
  } catch (error) {
    console.error('Error fetching parquet data summary:', error);
    res.status(500).json({ error: 'Failed to fetch parquet data summary: ' + error.message });
  }
});

// API endpoint to get parquet data with filtering
app.post('/api/parquet-data', async (req, res) => {
  try {
    const { startTime, endTime, minTws, maxTws, useMockData = true } = req.body;
    
    console.log('Fetching parquet data with filters:', { startTime, endTime, minTws, maxTws, useMockData });
    
    if (useMockData) {
      // Generate mock data
      const mockData = [];
      
      // Generate sample data points for testing
      for (let i = 0; i < 200; i++) {
        const twa = Math.random() * 180; // Random angle 0-180
        const bsp = Math.random() * 8 + 2; // Random boat speed 2-10 knots
        const tws = Math.random() * 20 + 5; // Random TWS 5-25 knots
        
        // Apply TWS filters if provided
        if (minTws && tws < minTws) {
          continue;
        }
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
      // Use pre-loaded parquet data from DuckDB
      console.log('Fetching real parquet data from pre-loaded DuckDB table...');
      
      try {
        if (!globalDb || !isParquetLoaded) {
          throw new Error('Parquet data not loaded. Please refresh the data first.');
        }
        
        // Build the SQL query with filters
        let sqlQuery = `
          SELECT bsp, twa, tws, utc
          FROM sailing_data
          WHERE 1=1
        `;
        
        // Add time filter if provided
        if (startTime && endTime) {
          // Convert datetime-local format to DuckDB timestamp format
          const formatTimestamp = (dateTimeLocal) => {
            // Convert from "YYYY-MM-DDTHH:MM" to "YYYY-MM-DD HH:MM:SS"
            return dateTimeLocal.replace('T', ' ') + ':00';
          };
          
          const formattedStartTime = formatTimestamp(startTime);
          const formattedEndTime = formatTimestamp(endTime);
          
          sqlQuery += ` AND utc >= '${formattedStartTime}' AND utc <= '${formattedEndTime}'`;
        }
        
        // Add TWS filters if provided
        if (minTws) {
          sqlQuery += ` AND tws >= ${minTws}`;
        }
        if (maxTws) {
          sqlQuery += ` AND tws <= ${maxTws}`;
        }
        
        console.log('Executing DuckDB query:', sqlQuery);
        
        // Execute the query
        const rows = await executeQuery(sqlQuery);
        
        console.log(`DuckDB returned ${rows.length} rows`);
        
        // Convert to the expected format
        const records = rows.map(row => ({
          bsp: parseFloat(row.bsp),
          twa: parseFloat(row.twa),
          tws: parseFloat(row.tws),
          timestamp: row.utc || new Date().toISOString()
        }));
        
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

// Helper function to calculate data summary from raw data
function calculateDataSummary(data, histogramBuckets = 10) {
  if (!data || data.length === 0) {
    return {
      totalPoints: 0,
      bsp: { min: 0, max: 0, avg: 0 },
      twa: { min: 0, max: 0, avg: 0 },
      tws: { min: 0, max: 0, avg: 0 },
      timeRange: { start: null, end: null },
      histograms: { tws: [], bsp: [], twa: [] }
    };
  }

  const bspValues = data.map(d => d.bsp);
  const twaValues = data.map(d => d.twa);
  const twsValues = data.map(d => d.tws);
  const timestamps = data.map(d => d.timestamp).sort();

  // Create histograms with specified number of buckets
  const createHistogram = (values, numBuckets = histogramBuckets) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / numBuckets;
    const bins = [];
    
    // Initialize bins
    for (let i = 0; i < numBuckets; i++) {
      const binStart = min + i * binWidth;
      bins.push({
        bin: parseFloat(binStart.toFixed(2)),
        count: 0
      });
    }
    
    // Populate bins
    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), numBuckets - 1);
      bins[binIndex].count++;
    });
    
    return bins;
  };

  return {
    totalPoints: data.length,
    bsp: {
      min: Math.min(...bspValues),
      max: Math.max(...bspValues),
      avg: bspValues.reduce((a, b) => a + b, 0) / bspValues.length
    },
    twa: {
      min: Math.min(...twaValues),
      max: Math.max(...twaValues),
      avg: twaValues.reduce((a, b) => a + b, 0) / twaValues.length
    },
    tws: {
      min: Math.min(...twsValues),
      max: Math.max(...twsValues),
      avg: twsValues.reduce((a, b) => a + b, 0) / twsValues.length
    },
    timeRange: {
      start: timestamps[0],
      end: timestamps[timestamps.length - 1]
    },
    histograms: {
      tws: createHistogram(twsValues, histogramBuckets),
      bsp: createHistogram(bspValues, histogramBuckets),
      twa: createHistogram(twaValues.map(Math.abs), histogramBuckets)
    }
  };
}

// Helper function to process histogram data from DuckDB
function processHistogramData(histogramRows) {
  const twsHist = {};
  const bspHist = {};
  const twaHist = {};
  
  histogramRows.forEach(row => {
    // Group by TWS bins - convert BigInt to Number
    if (row.tws_bin !== null) {
      const bin = Number(row.tws_bin);
      const count = Number(row.tws_count);
      twsHist[bin] = (twsHist[bin] || 0) + count;
    }
    // Group by BSP bins - convert BigInt to Number
    if (row.bsp_bin !== null) {
      const bin = Number(row.bsp_bin);
      const count = Number(row.bsp_count);
      bspHist[bin] = (bspHist[bin] || 0) + count;
    }
    // Group by TWA bins - convert BigInt to Number
    if (row.twa_bin !== null) {
      const bin = Number(row.twa_bin);
      const count = Number(row.twa_count);
      twaHist[bin] = (twaHist[bin] || 0) + count;
    }
  });
  
  return {
    tws: Object.entries(twsHist).map(([bin, count]) => ({ bin: parseInt(bin), count: Number(count) })),
    bsp: Object.entries(bspHist).map(([bin, count]) => ({ bin: parseInt(bin), count: Number(count) })),
    twa: Object.entries(twaHist).map(([bin, count]) => ({ bin: parseInt(bin), count: Number(count) }))
  };
}

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

// Initialize database on startup
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Parquet data loaded: ${isParquetLoaded}`);
  });
}).catch((error) => {
  console.error('Failed to initialize database, starting server anyway:', error);
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (without parquet data)`);
  });
});
