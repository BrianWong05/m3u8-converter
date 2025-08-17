import { useState, useEffect, useRef } from 'react';
import { Status, InputMode, ConversionState } from './types';

export const useConversion = () => {
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

  const state: ConversionState = {
    m3u8Url,
    selectedFile,
    inputMode,
    progress,
    status,
    viewLink,
    downloadLink,
    downloadFilename,
    errorMessage,
  };

  const handlers = {
    handleFileSelect,
    handleConvert,
    handleViewVideo,
    handleDownload,
    resetState,
    setInputMode,
    setM3u8Url,
  };

  return {
    state,
    handlers,
    fileInputRef,
  };
};