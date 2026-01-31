import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DropZone } from './DropZone';
import { UploadProgress } from './UploadProgress';
import { uploadAndAnalyze, saveAnalysis } from '@/services/api';
import { UploadProgress as UploadProgressType } from '@/types/analysis';

export function VideoUploader() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressType>({
    status: 'idle',
    progress: 0,
  });

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setUploadProgress({ status: 'uploading', progress: 0 });

    try {
      const result = await uploadAndAnalyze(file, (progress) => {
        setUploadProgress(progress);
      });

      // Save analysis to localStorage
      saveAnalysis(result);

      // Navigate to results after a short delay
      setTimeout(() => {
        navigate(`/results/${result.id}`);
      }, 1500);
    } catch (error) {
      setUploadProgress({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    }
  }, [navigate]);

  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    setUploadProgress({ status: 'idle', progress: 0 });
  }, []);

  const isUploading = uploadProgress.status !== 'idle';

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!isUploading ? (
        <DropZone onFileSelect={handleFileSelect} />
      ) : (
        <UploadProgress
          progress={uploadProgress}
          fileName={selectedFile?.name || 'video.mp4'}
          onCancel={uploadProgress.status !== 'complete' ? handleCancel : undefined}
        />
      )}
    </div>
  );
}
