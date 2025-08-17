import React from 'react';
import { FilmIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  return (
    <div className="text-center mb-8">
      <FilmIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">M3U8 to MP4 Converter</h1>
      <p className="text-gray-400">Convert M3U8 streams to downloadable MP4 files</p>
    </div>
  );
};

export default Header;