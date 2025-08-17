# M3U8 to MP4 Converter

A full-stack application for converting M3U8 video streams to downloadable MP4 files, built with React (frontend) and Node.js (backend).

## Project Structure

```
m3u8-converter/
├── ui/                     # Vite + React + TypeScript Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   │   ├── Header.tsx           # App header with title and icon
│   │   │   ├── InputTabs.tsx        # URL/File input mode tabs
│   │   │   ├── UrlInput.tsx         # M3U8 URL input field
│   │   │   ├── FileUpload.tsx       # File upload component
│   │   │   ├── ConvertButton.tsx    # Convert action button
│   │   │   ├── ProgressView.tsx     # Conversion progress display
│   │   │   ├── SuccessView.tsx      # Success state with view/download
│   │   │   ├── ErrorView.tsx        # Error state display
│   │   │   ├── IdleView.tsx         # Main input interface
│   │   │   ├── useConversion.ts     # Custom hook for conversion logic
│   │   │   ├── types.ts             # TypeScript type definitions
│   │   │   └── index.ts             # Component exports
│   │   ├── App.tsx        # Main React component (refactored)
│   │   ├── index.css      # Tailwind CSS styles
│   │   ├── main.tsx       # React entry point
│   │   └── types.d.ts     # TypeScript definitions for Electron integration
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
│
└── web-backend/            # Node.js + Express Server
    ├── src/
    │   └── server.ts      # Express server with FFmpeg integration
    ├── .gitignore
    ├── package.json
    └── tsconfig.json
```

## Prerequisites

Before running this project, make sure you have:

1. **Node.js** (v16 or higher) installed
2. **FFmpeg** installed and available in your system PATH
   - Windows: Download from https://ffmpeg.org/download.html
   - macOS: `brew install ffmpeg`
   - Linux: `sudo apt install ffmpeg` (Ubuntu/Debian) or equivalent

## Installation & Setup

You can run this application either with Docker (recommended) or manually with Node.js.

### Option 1: Docker Setup (Recommended)

#### Prerequisites
- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

#### Quick Start

**Production Mode:**
```bash
docker-compose up --build
```

**Development Mode:**
```bash
docker-compose -f docker-compose.dev.yml up --build
```

**Access the application:**
- Frontend: http://localhost:3000 (production) or http://localhost:5173 (development)
- Backend API: http://localhost:4000

**Stop services:**
```bash
docker-compose down
```

For detailed Docker instructions, see [DOCKER.md](DOCKER.md).

### Option 2: Manual Setup

#### 1. Install Frontend Dependencies

```bash
cd ui
npm install
```

#### 2. Install Backend Dependencies

```bash
cd ../web-backend
npm install
```

## Running the Application (Manual)

### 1. Start the Backend Server

```bash
cd web-backend
npm run dev
```

The backend will start on `http://localhost:4000`

### 2. Start the Frontend Development Server

In a new terminal:

```bash
cd ui
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is busy)

## Usage

1. Open your browser and navigate to the frontend URL (typically `http://localhost:5173`)
2. Choose your input method:
   - **URL Tab**: Enter a valid M3U8 URL in the input field
   - **Upload File Tab**: Click to select and upload an M3U8 playlist file from your computer
     - Supports both direct media playlists and master playlists
     - For master playlists, automatically selects the highest quality stream
3. Click "Convert to MP4" to start the conversion process
4. Wait for the conversion to complete (progress will be shown)
5. Choose your next action:
   - **View Video**: Preview the converted video in your browser
   - **Download MP4**: Download the converted file to your device
6. Use "Convert Another File" to reset and convert additional files

## Features

- **Modern UI**: Dark theme built with Tailwind CSS and Heroicons with tabbed interface
- **Dual Input Methods**: Support for both M3U8 URLs and file uploads
- **Master Playlist Support**: Automatically detects and converts the highest quality stream from master playlists
- **Video Preview**: View converted videos in browser before downloading
- **Smart Downloads**: Proper file downloads with fallback methods for browser compatibility
- **Real-time Progress**: Visual progress indication during conversion
- **Error Handling**: Comprehensive error messages and validation
- **File Validation**: Automatic validation of uploaded M3U8 files
- **Electron Ready**: Frontend is prepared for future Electron integration
- **Fast Conversion**: Uses FFmpeg with stream copying (no re-encoding) for speed
- **Temporary Storage**: Files are stored in system temp directory and served statically
- **Automatic Cleanup**: Uploaded files are automatically cleaned up after conversion

## API Endpoints

### POST /convert

Converts an M3U8 URL to MP4 format.

**Request Body:**

```json
{
  "m3u8Url": "https://example.com/playlist.m3u8"
}
```

**Success Response:**

```json
{
  "success": true,
  "downloadUrl": "http://localhost:4000/downloads/converted_1234567890.mp4",
  "filename": "converted_1234567890.mp4"
}
```

**Error Response:**

```json
{
  "error": "Conversion failed: [error message]"
}
```

### POST /convert-file

Converts an uploaded M3U8 file to MP4 format.

**Request Body:** `multipart/form-data`
- `m3u8File`: The M3U8 file to upload (max 10MB)

**Success Response:**

```json
{
  "success": true,
  "downloadUrl": "http://localhost:4000/downloads/converted_1234567890.mp4",
  "filename": "converted_1234567890.mp4"
}
```

**Error Response:**

```json
{
  "error": "Conversion failed: [error message]"
}
```

### GET /view/:filename

Serves a video file for inline viewing in the browser.

**Response:** Video file with `Content-Disposition: inline` header for browser playback.

### GET /download/:filename

Serves a video file for download.

**Response:** Video file with `Content-Disposition: attachment` header to trigger download.

### GET /health

Health check endpoint to verify server status.

## Building for Production

### Frontend

```bash
cd ui
npm run build
```

### Backend

```bash
cd web-backend
npm run build
npm start
```

## Future Electron Integration

The frontend is designed to work seamlessly with Electron. The `types.d.ts` file defines the `window.electronAPI` interface, and the React component includes conditional logic to use either the web backend or Electron's main process for conversions.

## Troubleshooting

1. **FFmpeg not found**: Make sure FFmpeg is installed and available in your system PATH
2. **CORS errors**: Ensure the backend is running on port 4000
3. **Conversion fails**: Check that the M3U8 URL is valid and accessible
4. **Port conflicts**: Modify the PORT variable in `server.ts` if port 4000 is in use

## Technologies Used

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Heroicons
- **Backend**: Node.js, Express, TypeScript, FFmpeg
- **Build Tools**: Vite, PostCSS, Autoprefixer
