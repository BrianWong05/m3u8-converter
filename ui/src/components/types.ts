export type Status = 'idle' | 'converting' | 'done' | 'error';
export type InputMode = 'url' | 'file';

export interface ConversionState {
  m3u8Url: string;
  selectedFile: File | null;
  inputMode: InputMode;
  progress: number;
  status: Status;
  viewLink: string | null;
  downloadLink: string | null;
  downloadFilename: string;
  errorMessage: string;
}

export interface ConversionHandlers {
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleConvert: () => Promise<void>;
  handleViewVideo: () => void;
  handleDownload: () => Promise<void>;
  resetState: () => void;
  setInputMode: (mode: InputMode) => void;
  setM3u8Url: (url: string) => void;
}