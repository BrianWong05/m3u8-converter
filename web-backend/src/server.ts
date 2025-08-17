import express, { Response } from 'express';
import cors from 'cors';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import os from 'os';
import multer from 'multer';

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Create downloads and uploads directories in system temp folder
const downloadsDir = path.join(os.tmpdir(), 'downloads');
const uploadsDir = path.join(os.tmpdir(), 'uploads');

if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `uploaded_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept .m3u8 files and text files
    if (file.mimetype === 'application/vnd.apple.mpegurl' || 
        file.mimetype === 'text/plain' || 
        file.originalname.toLowerCase().endsWith('.m3u8')) {
      cb(null, true);
    } else {
      cb(new Error('Only M3U8 files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Serve downloads directory statically
app.use('/downloads', express.static(downloadsDir, {
  setHeaders: (res, path) => {
    res.setHeader('Content-Type', 'video/mp4');
    // Don't set Content-Disposition here - let the endpoint decide
  }
}));

// Separate endpoint for viewing videos (inline)
app.get('/view/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(downloadsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Set headers for inline viewing
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Accept-Ranges', 'bytes');
  
  // Send the file for inline viewing
  res.sendFile(filePath);
});

// Separate endpoint for downloading videos
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(downloadsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Set headers for download
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  // Send the file for download
  res.sendFile(filePath);
});

// Store active conversions for progress tracking
interface ConversionData {
  progress: number;
  status: string;
  viewUrl?: string;
  downloadUrl?: string;
  filename?: string;
  error?: string;
}

const activeConversions = new Map<string, ConversionData>();

// Async version for progress tracking
const performConversionAsync = async (inputSource: string, isFile: boolean = false, conversionId: string) => {
  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const outputFilename = `converted_${timestamp}.mp4`;
  const outputPath = path.join(downloadsDir, outputFilename);

  console.log(`Starting conversion of: ${inputSource}`);
  console.log(`Output path: ${outputPath}`);

  // Validate input file exists if it's a file
  if (isFile && !fs.existsSync(inputSource)) {
    console.error('Input file does not exist:', inputSource);
    activeConversions.set(conversionId, { progress: 0, status: 'error' });
    return;
  }

  // Ensure output directory exists and is writable
  try {
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }
    // Test write permissions
    const testFile = path.join(downloadsDir, `test_${timestamp}.tmp`);
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
  } catch (error) {
    console.error('Cannot write to downloads directory:', error);
    activeConversions.set(conversionId, { progress: 0, status: 'error' });
    return;
  }

  const ffmpegCommand = ffmpeg(inputSource);

  // Add user agent for URL inputs
  if (!isFile) {
    ffmpegCommand.inputOptions([
      '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ]);
  } else {
    // For file inputs, add some additional options to handle various M3U8 formats
    ffmpegCommand.inputOptions([
      '-protocol_whitelist', 'file,http,https,tcp,tls,crypto'
    ]);
  }

  ffmpegCommand
    .outputOptions([
      '-c', 'copy',  // Copy streams without re-encoding for speed
      '-avoid_negative_ts', 'make_zero',  // Handle timestamp issues
      '-fflags', '+genpts',  // Generate presentation timestamps
      '-movflags', '+faststart'  // Optimize for web playback
    ])
    .output(outputPath)
    .on('start', (commandLine) => {
      console.log('FFmpeg command: ' + commandLine);
      activeConversions.set(conversionId, { progress: 0, status: 'converting' });
    })
    .on('progress', (progress) => {
      const progressPercent = Math.round(progress.percent || 0);
      console.log(`Processing: ${progressPercent}% done`);
      
      activeConversions.set(conversionId, { 
        progress: progressPercent, 
        status: 'converting' 
      });
    })
    .on('end', () => {
      console.log('Conversion finished successfully');
      
      // Update progress to completed with file info
      const viewUrl = `http://localhost:${PORT}/view/${outputFilename}`;
      const downloadUrl = `http://localhost:${PORT}/download/${outputFilename}`;
      
      activeConversions.set(conversionId, { 
        progress: 100, 
        status: 'completed',
        viewUrl: viewUrl,
        downloadUrl: downloadUrl,
        filename: outputFilename
      });
      
      // Clean up uploaded file if it was a file upload
      if (isFile && fs.existsSync(inputSource)) {
        try {
          fs.unlinkSync(inputSource);
          console.log('Cleaned up uploaded file:', inputSource);
        } catch (cleanupErr) {
          console.error('Error cleaning up uploaded file:', cleanupErr);
        }
      }
      
      // Clean up after a delay to allow final progress fetch
      setTimeout(() => {
        activeConversions.delete(conversionId);
      }, 300000); // 5 minutes
    })
    .on('error', (err: any) => {
      console.error('FFmpeg error:', err.message);
      console.error('FFmpeg stderr:', err.stderr || 'No stderr available');
      
      // Update progress to error state
      activeConversions.set(conversionId, { 
        progress: 0, 
        status: 'error',
        error: err.message
      });
      
      // Clean up partial output file if it exists
      if (fs.existsSync(outputPath)) {
        try {
          fs.unlinkSync(outputPath);
        } catch (cleanupErr) {
          console.error('Error cleaning up partial file:', cleanupErr);
        }
      }
      
      // Clean up uploaded file if it was a file upload
      if (isFile && fs.existsSync(inputSource)) {
        try {
          fs.unlinkSync(inputSource);
        } catch (cleanupErr) {
          console.error('Error cleaning up uploaded file:', cleanupErr);
        }
      }
      
      // Clean up after a delay
      setTimeout(() => {
        activeConversions.delete(conversionId);
      }, 30000); // 30 seconds
    })
    .run();
};

// Helper function to perform FFmpeg conversion
const performConversion = (inputSource: string, res: Response, isFile: boolean = false, conversionId?: string) => {
  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const outputFilename = `converted_${timestamp}.mp4`;
  const outputPath = path.join(downloadsDir, outputFilename);

  console.log(`Starting conversion of: ${inputSource}`);
  console.log(`Output path: ${outputPath}`);

  // Validate input file exists if it's a file
  if (isFile && !fs.existsSync(inputSource)) {
    console.error('Input file does not exist:', inputSource);
    return res.status(400).json({
      error: 'Input file not found'
    });
  }

  // Ensure output directory exists and is writable
  try {
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }
    // Test write permissions
    const testFile = path.join(downloadsDir, `test_${timestamp}.tmp`);
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
  } catch (error) {
    console.error('Cannot write to downloads directory:', error);
    return res.status(500).json({
      error: 'Server storage error - cannot write output file'
    });
  }

  const ffmpegCommand = ffmpeg(inputSource);

  // Add user agent for URL inputs
  if (!isFile) {
    ffmpegCommand.inputOptions([
      '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ]);
  } else {
    // For file inputs, add some additional options to handle various M3U8 formats
    ffmpegCommand.inputOptions([
      '-protocol_whitelist', 'file,http,https,tcp,tls,crypto'
    ]);
  }

  ffmpegCommand
    .outputOptions([
      '-c', 'copy',  // Copy streams without re-encoding for speed
      '-avoid_negative_ts', 'make_zero',  // Handle timestamp issues
      '-fflags', '+genpts',  // Generate presentation timestamps
      '-movflags', '+faststart'  // Optimize for web playback
    ])
    .output(outputPath)
    .on('start', (commandLine) => {
      console.log('FFmpeg command: ' + commandLine);
    })
    .on('progress', (progress) => {
      const progressPercent = Math.round(progress.percent || 0);
      console.log(`Processing: ${progressPercent}% done`);
      
      // Update progress in activeConversions if conversionId is provided
      if (conversionId) {
        activeConversions.set(conversionId, { 
          progress: progressPercent, 
          status: 'converting' 
        });
      }
    })
    .on('end', () => {
      console.log('Conversion finished successfully');
      
      // Update progress to completed
      if (conversionId) {
        activeConversions.set(conversionId, { 
          progress: 100, 
          status: 'completed' 
        });
        // Clean up after a delay to allow final progress fetch
        setTimeout(() => {
          activeConversions.delete(conversionId);
        }, 30000); // 30 seconds
      }
      
      // Clean up uploaded file if it was a file upload
      if (isFile && fs.existsSync(inputSource)) {
        try {
          fs.unlinkSync(inputSource);
          console.log('Cleaned up uploaded file:', inputSource);
        } catch (cleanupErr) {
          console.error('Error cleaning up uploaded file:', cleanupErr);
        }
      }
      
      // Construct the URLs for viewing and downloading
      const viewUrl = `http://localhost:${PORT}/view/${outputFilename}`;
      const downloadUrl = `http://localhost:${PORT}/download/${outputFilename}`;
      
      res.json({
        success: true,
        viewUrl: viewUrl,
        downloadUrl: downloadUrl,
        filename: outputFilename
      });
    })
    .on('error', (err: any) => {
      console.error('FFmpeg error:', err.message);
      console.error('FFmpeg stderr:', err.stderr || 'No stderr available');
      
      // Log additional debug info for file uploads
      if (isFile) {
        console.log('=== Debug Info for Failed File Conversion ===');
        console.log('Input file:', inputSource);
        console.log('Output file:', outputPath);
        console.log('Input file exists:', fs.existsSync(inputSource));
        console.log('Output dir exists:', fs.existsSync(path.dirname(outputPath)));
        
        // Try to read a bit of the input file for debugging
        try {
          const content = fs.readFileSync(inputSource, 'utf8');
          console.log('Input file first 200 chars:', content.substring(0, 200));
        } catch (readErr: any) {
          console.log('Cannot read input file:', readErr?.message || 'Unknown error');
        }
      }
      
      // Clean up partial output file if it exists
      if (fs.existsSync(outputPath)) {
        try {
          fs.unlinkSync(outputPath);
        } catch (cleanupErr) {
          console.error('Error cleaning up partial file:', cleanupErr);
        }
      }
      
      // Update progress to error state
      if (conversionId) {
        activeConversions.set(conversionId, { 
          progress: 0, 
          status: 'error' 
        });
        // Clean up after a delay
        setTimeout(() => {
          activeConversions.delete(conversionId);
        }, 30000); // 30 seconds
      }
      
      // Clean up uploaded file if it was a file upload
      if (isFile && fs.existsSync(inputSource)) {
        try {
          fs.unlinkSync(inputSource);
        } catch (cleanupErr) {
          console.error('Error cleaning up uploaded file:', cleanupErr);
        }
      }
      
      // Provide more helpful error messages
      let userError = `Conversion failed: ${err.message}`;
      if (err.message.includes('Invalid argument')) {
        userError = 'Conversion failed: The M3U8 file format may be incompatible or the media segments are not accessible.';
      } else if (err.message.includes('No such file')) {
        userError = 'Conversion failed: Media segments referenced in the M3U8 file could not be found.';
      } else if (err.message.includes('Permission denied')) {
        userError = 'Conversion failed: Server permission error. Please try again.';
      }
      
      res.status(500).json({
        error: userError
      });
    })
    .run();
};

// POST /convert endpoint (for URL input)
app.post('/convert', async (req, res) => {
  try {
    const { m3u8Url } = req.body;

    // Basic validation
    if (!m3u8Url || typeof m3u8Url !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing m3u8Url' });
    }

    // Generate unique conversion ID
    const conversionId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize progress tracking
    activeConversions.set(conversionId, { progress: 0, status: 'starting' });

    // Return conversion ID immediately for progress tracking
    res.json({
      success: true,
      conversionId: conversionId,
      message: 'Conversion started'
    });

    // Start conversion asynchronously
    performConversionAsync(m3u8Url, false, conversionId);

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error occurred during conversion'
    });
  }
});

// Helper function to validate and process M3U8 file content
const validateM3U8File = (filePath: string): { valid: boolean; error?: string; isMasterPlaylist?: boolean; bestStreamUrl?: string } => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file starts with #EXTM3U
    if (!content.trim().startsWith('#EXTM3U')) {
      return { valid: false, error: 'Invalid M3U8 file: must start with #EXTM3U' };
    }
    
    // Check if this is a master playlist (contains #EXT-X-STREAM-INF)
    const isMasterPlaylist = content.includes('#EXT-X-STREAM-INF');
    
    if (isMasterPlaylist) {
      // Extract stream URLs from master playlist
      const lines = content.split('\n');
      const streams: { bandwidth: number; resolution?: string; url: string }[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#EXT-X-STREAM-INF:')) {
          // Parse bandwidth and resolution
          const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/);
          const resolutionMatch = line.match(/RESOLUTION=([^,]+)/);
          
          // Next non-comment line should be the URL
          let j = i + 1;
          while (j < lines.length && lines[j].trim().startsWith('#')) {
            j++;
          }
          
          if (j < lines.length && lines[j].trim()) {
            streams.push({
              bandwidth: bandwidthMatch ? parseInt(bandwidthMatch[1]) : 0,
              resolution: resolutionMatch ? resolutionMatch[1] : undefined,
              url: lines[j].trim()
            });
          }
        }
      }
      
      if (streams.length === 0) {
        return { valid: false, error: 'Master playlist found but no valid streams detected' };
      }
      
      // Select the highest quality stream (highest bandwidth)
      const bestStream = streams.reduce((best, current) => 
        current.bandwidth > best.bandwidth ? current : best
      );
      
      console.log(`Master playlist detected with ${streams.length} streams. Selected: ${bestStream.resolution || 'unknown resolution'} (${bestStream.bandwidth} bps)`);
      
      return { 
        valid: true, 
        isMasterPlaylist: true, 
        bestStreamUrl: bestStream.url 
      };
    } else {
      // Check if file has direct media segments
      const hasSegments = content.includes('#EXTINF') || content.includes('.ts') || content.includes('.m4s');
      if (!hasSegments) {
        return { valid: false, error: 'Invalid M3U8 file: no media segments found' };
      }
      
      return { valid: true, isMasterPlaylist: false };
    }
  } catch (error) {
    return { valid: false, error: 'Cannot read uploaded file' };
  }
};

// POST /convert-file endpoint (for file upload)
app.post('/convert-file', upload.single('m3u8File'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadedFilePath = req.file.path;
    console.log(`File uploaded: ${uploadedFilePath}`);

    // Validate M3U8 file content
    const validation = validateM3U8File(uploadedFilePath);
    if (!validation.valid) {
      // Clean up invalid file
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (cleanupErr) {
        console.error('Error cleaning up invalid file:', cleanupErr);
      }
      return res.status(400).json({ error: validation.error });
    }

    // Generate unique conversion ID
    const conversionId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize progress tracking
    activeConversions.set(conversionId, { progress: 0, status: 'starting' });

    // Return conversion ID immediately for progress tracking
    res.json({
      success: true,
      conversionId: conversionId,
      message: 'Conversion started'
    });

    // Handle master playlists by using the best stream URL
    if (validation.isMasterPlaylist && validation.bestStreamUrl) {
      console.log('Converting master playlist using best stream URL:', validation.bestStreamUrl);
      
      // Clean up the uploaded master playlist file since we're using the URL
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (cleanupErr) {
        console.error('Error cleaning up master playlist file:', cleanupErr);
      }
      
      // Use the selected stream URL for conversion (treat as URL, not file)
      performConversionAsync(validation.bestStreamUrl, false, conversionId);
    } else {
      // Direct media playlist - use the file
      performConversionAsync(uploadedFilePath, true, conversionId);
    }

  } catch (error) {
    console.error('Server error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupErr) {
        console.error('Error cleaning up uploaded file:', cleanupErr);
      }
    }
    
    res.status(500).json({
      error: 'Internal server error occurred during file conversion'
    });
  }
});

// Progress tracking endpoint
app.get('/progress/:conversionId', (req, res) => {
  const conversionId = req.params.conversionId;
  const conversion = activeConversions.get(conversionId);
  
  if (!conversion) {
    return res.status(404).json({ error: 'Conversion not found' });
  }
  
  const response: any = {
    progress: conversion.progress,
    status: conversion.status
  };
  
  // Add additional data if conversion is completed
  if (conversion.status === 'completed') {
    response.viewUrl = conversion.viewUrl;
    response.downloadUrl = conversion.downloadUrl;
    response.filename = conversion.filename;
  }
  
  // Add error message if conversion failed
  if (conversion.status === 'error' && conversion.error) {
    response.error = conversion.error;
  }
  
  res.json(response);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'M3U8 Converter Backend is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`M3U8 Converter Backend running on http://localhost:${PORT}`);
  console.log(`Downloads directory: ${downloadsDir}`);
  console.log(`Uploads directory: ${uploadsDir}`);
  console.log('Make sure FFmpeg is installed and available in your system PATH');
  console.log('Available endpoints:');
  console.log('  POST /convert - Convert M3U8 URL to MP4');
  console.log('  POST /convert-file - Convert uploaded M3U8 file to MP4');
  console.log('  GET /health - Health check');
});