import express from 'express';
import cors from 'cors';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import os from 'os';

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Create downloads directory in system temp folder
const downloadsDir = path.join(os.tmpdir(), 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Serve downloads directory statically
app.use('/downloads', express.static(downloadsDir));

// POST /convert endpoint
app.post('/convert', async (req, res) => {
  try {
    const { m3u8Url } = req.body;

    // Basic validation
    if (!m3u8Url || typeof m3u8Url !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing m3u8Url' });
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const outputFilename = `converted_${timestamp}.mp4`;
    const outputPath = path.join(downloadsDir, outputFilename);

    console.log(`Starting conversion of: ${m3u8Url}`);
    console.log(`Output path: ${outputPath}`);

    // Use fluent-ffmpeg to process the M3U8 URL
    ffmpeg(m3u8Url)
      .inputOptions([
        '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ])
      .outputOptions([
        '-c', 'copy'  // Copy streams without re-encoding for speed
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg command: ' + commandLine);
      })
      .on('progress', (progress) => {
        console.log(`Processing: ${progress.percent}% done`);
      })
      .on('end', () => {
        console.log('Conversion finished successfully');
        
        // Construct the full publicly accessible download URL
        const downloadUrl = `http://localhost:${PORT}/downloads/${outputFilename}`;
        
        res.json({
          success: true,
          downloadUrl: downloadUrl,
          filename: outputFilename
        });
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err.message);
        
        // Clean up partial file if it exists
        if (fs.existsSync(outputPath)) {
          try {
            fs.unlinkSync(outputPath);
          } catch (cleanupErr) {
            console.error('Error cleaning up partial file:', cleanupErr);
          }
        }
        
        res.status(500).json({
          error: `Conversion failed: ${err.message}`
        });
      })
      .run();

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error occurred during conversion'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'M3U8 Converter Backend is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`M3U8 Converter Backend running on http://localhost:${PORT}`);
  console.log(`Downloads directory: ${downloadsDir}`);
  console.log('Make sure FFmpeg is installed and available in your system PATH');
});