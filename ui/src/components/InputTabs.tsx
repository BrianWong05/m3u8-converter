import React from 'react';
import { DocumentArrowUpIcon, LinkIcon } from '@heroicons/react/24/outline';
import { InputMode } from './types';

interface InputTabsProps {
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
}

const InputTabs: React.FC<InputTabsProps> = ({ inputMode, setInputMode }) => {
  return (
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
  );
};

export default InputTabs;