import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DropZone } from './DropZone';
import { UploadProgress } from './UploadProgress';
import { uploadAndAnalyze, saveAnalysis } from '@/services/api';
import { UploadProgress as UploadProgressType } from '@/types/analysis';

export function VideoUploader() {
  const navigate = useNavigate();

  // Toggle demo mode (mock analysis) vs real backend
  // Set VITE_DEMO=true in .env.local if you want to run without a backend.
  const DEMO_MODE = import.meta.env.VITE_DEMO === 'true';

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [uploadProgress, setUploadProgress] = useState<UploadProgressType>({
    status: 'idle',
    progress: 0,
  });

  // AbortController ref so we can cancel in-flight upload/processing
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup on unmount + revoke preview url
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setSelectedFile(file);
      const nextPreview = URL.createObjectURL(file);

      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextPreview;
      });

      setUploadProgress({ status: 'uploading', progress: 0, message: 'Uploading video…' });

      try {
        const result = await uploadAndAnalyze(
          file,
          (progress) => setUploadProgress(progress),
          {
            signal: abortRef.current.signal,
            demo: DEMO_MODE,
          }
        );

        saveAnalysis(result);

        setUploadProgress({
          status: 'complete',
          progress: 100,
          message: 'Analysis complete!',
          analysisId: result.id,
        });

        setTimeout(() => {
          navigate(`/results/${result.id}`);
        }, 900);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          setSelectedFile(null);
          setUploadProgress({ status: 'idle', progress: 0 });
          return;
        }

        setUploadProgress({
          status: 'error',
          progress: 0,
          message: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    },
    [navigate, DEMO_MODE]
  );

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    setSelectedFile(null);
    setUploadProgress({ status: 'idle', progress: 0 });
  }, []);

  const isActive = uploadProgress.status !== 'idle';

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Preview during upload/processing for polish */}
      {previewUrl && isActive && (
        <div className="rounded-xl overflow-hidden border border-border bg-black">
          <video src={previewUrl} className="w-full aspect-video" muted playsInline preload="metadata" />
        </div>
      )}

      {!isActive ? (
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
