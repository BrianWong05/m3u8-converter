import React from 'react';
import { InputMode } from './types';

interface ProgressViewProps {
  inputMode: InputMode;
  m3u8Url: string;
  selectedFile: File | null;
  progress: number;
}

const ProgressView: React.FC<ProgressViewProps> = ({ inputMode, m3u8Url, selectedFile, progress }) => {
  return (
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
  );
};

export default ProgressView;