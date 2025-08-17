import React from 'react';
import { XCircleIcon } from '@heroicons/react/24/outline';

interface ErrorViewProps {
  errorMessage: string;
  resetState: () => void;
}

const ErrorView: React.FC<ErrorViewProps> = ({ errorMessage, resetState }) => {
  return (
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
  );
};

export default ErrorView;