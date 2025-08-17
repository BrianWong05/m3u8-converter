import React from 'react';

interface UrlInputProps {
  m3u8Url: string;
  setM3u8Url: (url: string) => void;
}

const UrlInput: React.FC<UrlInputProps> = ({ m3u8Url, setM3u8Url }) => {
  return (
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
  );
};

export default UrlInput;