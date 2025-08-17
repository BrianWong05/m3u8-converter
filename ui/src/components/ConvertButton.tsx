import React from 'react';
import { FilmIcon } from '@heroicons/react/24/outline';

interface ConvertButtonProps {
  handleConvert: () => Promise<void>;
}

const ConvertButton: React.FC<ConvertButtonProps> = ({ handleConvert }) => {
  return (
    <button
      onClick={handleConvert}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center space-x-2"
    >
      <FilmIcon className="h-5 w-5" />
      <span>Convert to MP4</span>
    </button>
  );
};

export default ConvertButton;