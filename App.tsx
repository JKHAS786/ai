import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ImageDisplay } from './components/ImageDisplay';
import { PromptControls } from './components/PromptControls';
import { editImageWithPrompt } from './services/geminiService';
import { toBase64 } from './utils/fileUtils';

interface ImageFile {
  file: File;
  base64: string;
  previewUrl: string;
}

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [editedImageBase64, setEditedImageBase64] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback(async (file: File) => {
    setError(null);
    setEditedImageBase64(null);
    try {
      const base64 = await toBase64(file);
      setOriginalImage({
        file,
        base64,
        previewUrl: URL.createObjectURL(file),
      });
    } catch (err) {
      setError('Failed to process the image file. Please try another one.');
      console.error(err);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!originalImage || !prompt) {
      setError('Please upload an image and enter a prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEditedImageBase64(null);

    try {
      const resultBase64 = await editImageWithPrompt(
        originalImage.base64,
        originalImage.file.type,
        prompt
      );

      if (resultBase64) {
        setEditedImageBase64(resultBase64);
      } else {
        setError('The model did not return an image. Please try a different prompt.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Generation failed: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      <Header />
      <main className="flex-grow container mx-auto p-4 flex flex-col gap-6">
        {error && (
          <div className="bg-red-900/50 border border-red-600 text-red-300 px-4 py-3 rounded-lg text-center" role="alert">
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="flex flex-col gap-6">
            <FileUpload onImageSelect={handleImageUpload} disabled={isLoading} />
            <PromptControls
              prompt={prompt}
              onPromptChange={setPrompt}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              disabled={!originalImage}
            />
          </div>
          <ImageDisplay
            originalImageUrl={originalImage?.previewUrl ?? null}
            editedImageBase64={editedImageBase64}
            isLoading={isLoading}
          />
        </div>
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>Powered by Gemini 2.5 Flash Image</p>
      </footer>
    </div>
  );
};

export default App;
