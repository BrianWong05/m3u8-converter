import React from 'react';
import { ArrowDownTrayIcon, PlayIcon } from '@heroicons/react/24/outline';

interface SuccessViewProps {
  handleViewVideo: () => void;
  handleDownload: () => Promise<void>;
  resetState: () => void;
}

const SuccessView: React.FC<SuccessViewProps> = ({ handleViewVideo, handleDownload, resetState }) => {
  return (
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
  );
};

export default SuccessView;