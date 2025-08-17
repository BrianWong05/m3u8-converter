import React from 'react';

interface FileUploadProps {
  selectedFile: File | null;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const FileUpload: React.FC<FileUploadProps> = ({ selectedFile, handleFileSelect, fileInputRef }) => {
  return (
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
  );
};

export default FileUpload;