import { Header, IdleView, ProgressView, SuccessView, ErrorView, useConversion } from './components';

function App() {
  const { state, handlers, fileInputRef } = useConversion();

  const renderContent = () => {
    switch (state.status) {
      case 'idle':
        return (
          <IdleView
            inputMode={state.inputMode}
            setInputMode={handlers.setInputMode}
            m3u8Url={state.m3u8Url}
            setM3u8Url={handlers.setM3u8Url}
            selectedFile={state.selectedFile}
            handleFileSelect={handlers.handleFileSelect}
            fileInputRef={fileInputRef}
            handleConvert={handlers.handleConvert}
          />
        );
      case 'converting':
        return (
          <ProgressView
            inputMode={state.inputMode}
            m3u8Url={state.m3u8Url}
            selectedFile={state.selectedFile}
            progress={state.progress}
          />
        );
      case 'done':
        return (
          <SuccessView
            handleViewVideo={handlers.handleViewVideo}
            handleDownload={handlers.handleDownload}
            resetState={handlers.resetState}
          />
        );
      case 'error':
        return (
          <ErrorView
            errorMessage={state.errorMessage}
            resetState={handlers.resetState}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
        <Header />
        {renderContent()}
      </div>
    </div>
  );
}

export default App;