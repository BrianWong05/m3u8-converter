import React from 'react';
import InputTabs from './InputTabs';
import UrlInput from './UrlInput';
import FileUpload from './FileUpload';
import ConvertButton from './ConvertButton';
import { InputMode } from './types';

interface IdleViewProps {
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
  m3u8Url: string;
  setM3u8Url: (url: string) => void;
  selectedFile: File | null;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleConvert: () => Promise<void>;
}

const IdleView: React.FC<IdleViewProps> = ({
  inputMode,
  setInputMode,
  m3u8Url,
  setM3u8Url,
  selectedFile,
  handleFileSelect,
  fileInputRef,
  handleConvert,
}) => {
  return (
    <div className="space-y-4">
      <InputTabs inputMode={inputMode} setInputMode={setInputMode} />
      
      {inputMode === 'url' && (
        <UrlInput m3u8Url={m3u8Url} setM3u8Url={setM3u8Url} />
      )}
      
      {inputMode === 'file' && (
        <FileUpload
          selectedFile={selectedFile}
          handleFileSelect={handleFileSelect}
          fileInputRef={fileInputRef}
        />
      )}
      
      <ConvertButton handleConvert={handleConvert} />
    </div>
  );
};

export default IdleView;