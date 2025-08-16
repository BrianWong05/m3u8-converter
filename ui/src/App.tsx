import React, { useState, useEffect } from 'react';
import { FilmIcon, ArrowDownTrayIcon, XCircleIcon } from '@heroicons/react/24/outline';

type Status = 'idle' | 'converting' | 'done' | 'error';

function App() {
  const [m3u8Url, setM3u8Url] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<Status>('idle');
  const [downloadLink, setDownloadLink] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

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

  const handleConvert = async () => {
    if (!m3u8Url.trim()) {
      setStatus('error');
      setErrorMessage('Please enter a valid M3U8 URL');
      return;
    }

    setStatus('converting');
    setProgress(0);
    setErrorMessage('');
    setDownloadLink(null);

    // Check if running in Electron
    if (window.electronAPI) {
      // Use Electron API
      window.electronAPI.startConversion(m3u8Url);
    } else {
      // Use web backend
      try {
        const response = await fetch('http://localhost:4000/convert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ m3u8Url }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('done');
          setDownloadLink(data.downloadUrl);
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

  const resetState = () => {
    setStatus('idle');
    setM3u8Url('');
    setProgress(0);
    setDownloadLink(null);
    setErrorMessage('');
  };

  const handleDownload = () => {
    if (downloadLink) {
      window.open(downloadLink, '_blank');
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
              <label htmlFor="m3u8-url-disabled" className="block text-sm font-medium text-gray-300 mb-2">
                M3U8 URL
              </label>
              <input
                id="m3u8-url-disabled"
                type="url"
                value={m3u8Url}
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
              <button
                onClick={handleDownload}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 flex items-center justify-center space-x-2 mb-3"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                <span>Download MP4</span>
              </button>
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