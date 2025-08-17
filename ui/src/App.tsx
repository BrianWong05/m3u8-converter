import React, { useState, useEffect, useRef } from 'react';
import { FilmIcon, ArrowDownTrayIcon, XCircleIcon, DocumentArrowUpIcon, LinkIcon, PlayIcon } from '@heroicons/react/24/outline';

type Status = 'idle' | 'converting' | 'done' | 'error';
type InputMode = 'url' | 'file';

function App() {
  const [m3u8Url, setM3u8Url] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('url');
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<Status>('idle');
  const [viewLink, setViewLink] = useState<string | null>(null);
  const [downloadLink, setDownloadLink] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set up Electron event listeners for future integration
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onConversionProgress((progress: number) => {
        setProgress(progress);
      });

      window.electronAPI.onConversionComplete((downloadPath: string) => {
        setStatus('done');
        setDownloadLink(downloadPath);
        setProgress(100);
      });

      window.electronAPI.onConversionError((error: string) => {
        setStatus('error');
        setErrorMessage(error);
      });
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.m3u8') && file.type !== 'application/vnd.apple.mpegurl') {
        setStatus('error');
        setErrorMessage('Please select a valid M3U8 file');
        return;
      }
      setSelectedFile(file);
      setErrorMessage('');
    }
  };

  const handleConvert = async () => {
    // Validation based on input mode
    if (inputMode === 'url') {
      if (!m3u8Url.trim()) {
        setStatus('error');
        setErrorMessage('Please enter a valid M3U8 URL');
        return;
      }
    } else {
      if (!selectedFile) {
        setStatus('error');
        setErrorMessage('Please select an M3U8 file');
        return;
      }
    }

    setStatus('converting');
    setProgress(0);
    setErrorMessage('');
    setViewLink(null);
    setDownloadLink(null);

    // Check if running in Electron
    if (window.electronAPI) {
      // Use Electron API (only supports URL for now)
      if (inputMode === 'url') {
        window.electronAPI.startConversion(m3u8Url);
      } else {
        setStatus('error');
        setErrorMessage('File upload not supported in Electron mode yet');
      }
    } else {
      // Use web backend
      try {
        let response;
        
        if (inputMode === 'url') {
          // URL conversion
          response = await fetch('http://localhost:4000/convert', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ m3u8Url }),
          });
        } else {
          // File upload conversion
          const formData = new FormData();
          formData.append('m3u8File', selectedFile!);
          
          response = await fetch('http://localhost:4000/convert-file', {
            method: 'POST',
            body: formData,
          });
        }

        const data = await response.json();

        if (response.ok) {
          setStatus('done');
          setViewLink(data.viewUrl);
          setDownloadLink(data.downloadUrl);
          setDownloadFilename(data.filename || `converted_video_${Date.now()}.mp4`);
          setProgress(100);
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Conversion failed');
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage('Failed to connect to server. Make sure the backend is running on port 4000.');
      }
    }
  };

  const handleViewVideo = () => {
    if (viewLink) {
      window.open(viewLink, '_blank');
    }
  };

  const resetState = () => {
    setStatus('idle');
    setM3u8Url('');
    setSelectedFile(null);
    setProgress(0);
    setViewLink(null);
    setDownloadLink(null);
    setDownloadFilename('');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async () => {
    if (!downloadLink) return;

    try {
      // Fetch the file as a blob
      const response = await fetch(downloadLink);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFilename || `converted_video_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: try direct link download
      try {
        const a = document.createElement('a');
        a.href = downloadLink;
        a.download = downloadFilename || `converted_video_${Date.now()}.mp4`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (fallbackError) {
        console.error('Fallback download failed:', fallbackError);
        // Last resort: open in new tab
        window.open(downloadLink, '_blank');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <FilmIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">M3U8 to MP4 Converter</h1>
          <p className="text-gray-400">Convert M3U8 streams to downloadable MP4 files</p>
        </div>

        {status === 'idle' && (
          <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setInputMode('url')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  inputMode === 'url'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                <LinkIcon className="h-4 w-4" />
                <span>URL</span>
              </button>
              <button
                onClick={() => setInputMode('file')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  inputMode === 'file'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                <DocumentArrowUpIcon className="h-4 w-4" />
                <span>Upload File</span>
              </button>
            </div>

            {/* URL Input */}
            {inputMode === 'url' && (
              <div>
                <label htmlFor="m3u8-url" className="block text-sm font-medium text-gray-300 mb-2">
                  M3U8 URL
                </label>
                <input
                  id="m3u8-url"
                  type="url"
                  value={m3u8Url}
                  onChange={(e) => setM3u8Url(e.target.value)}
                  placeholder="https://example.com/playlist.m3u8"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* File Upload */}
            {inputMode === 'file' && (
              <div>
                <label htmlFor="m3u8-file" className="block text-sm font-medium text-gray-300 mb-2">
                  M3U8 File
                </label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    id="m3u8-file"
                    type="file"
                    accept=".m3u8,application/vnd.apple.mpegurl"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-left text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    {selectedFile ? selectedFile.name : 'Click to select M3U8 file...'}
                  </button>
                  {selectedFile && (
                    <div className="mt-2 text-sm text-gray-400">
                      File size: {(selectedFile.size / 1024).toFixed(1)} KB
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleConvert}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center space-x-2"
            >
              <FilmIcon className="h-5 w-5" />
              <span>Convert to MP4</span>
            </button>
          </div>
        )}

        {status === 'converting' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="converting-source" className="block text-sm font-medium text-gray-300 mb-2">
                {inputMode === 'url' ? 'M3U8 URL' : 'M3U8 File'}
              </label>
              <input
                id="converting-source"
                type="text"
                value={inputMode === 'url' ? m3u8Url : selectedFile?.name || ''}
                disabled
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-300 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-300">
                <span>Converting...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            <button
              disabled
              className="w-full bg-gray-600 text-gray-400 font-medium py-2 px-4 rounded-md cursor-not-allowed"
            >
              Converting...
            </button>
          </div>
        )}

        {status === 'done' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="bg-green-900 border border-green-700 rounded-md p-4 mb-4">
                <p className="text-green-300 font-medium">Conversion completed successfully!</p>
              </div>
              
              {/* Action buttons */}
              <div className="space-y-3 mb-3">
                <button
                  onClick={handleViewVideo}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 flex items-center justify-center space-x-2"
                >
                  <PlayIcon className="h-5 w-5" />
                  <span>View Video</span>
                </button>
                
                <button
                  onClick={handleDownload}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 flex items-center justify-center space-x-2"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  <span>Download MP4</span>
                </button>
              </div>
            </div>
            
            <button
              onClick={resetState}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              Convert Another File
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="bg-red-900 border border-red-700 rounded-md p-4">
              <div className="flex items-center space-x-2">
                <XCircleIcon className="h-5 w-5 text-red-400" />
                <p className="text-red-300 font-medium">Conversion Failed</p>
              </div>
              <p className="text-red-200 text-sm mt-2">{errorMessage}</p>
            </div>
            <button
              onClick={resetState}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              Convert Another File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;