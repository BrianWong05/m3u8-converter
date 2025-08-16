export interface IElectronAPI {
  startConversion: (m3u8Url: string) => void;
  onConversionProgress: (callback: (progress: number) => void) => void;
  onConversionComplete: (callback: (downloadPath: string) => void) => void;
  onConversionError: (callback: (error: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}