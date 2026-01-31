import { useCallback, useState } from 'react';
import { Upload, Film, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateVideoFile } from '@/services/api';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFileSelect, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    const validation = validateVideoFile(file);
    
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }
    
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [disabled, handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-4">
      <label
        className={cn(
          'relative flex flex-col items-center justify-center w-full min-h-[300px] rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer',
          isDragging
            ? 'border-primary bg-primary/10 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-muted/50',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-destructive/50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="sr-only"
          accept="video/mp4,video/quicktime,video/x-m4v,.mp4,.mov,.m4v"
          onChange={handleInputChange}
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-4 p-8 text-center">
          {/* Icon */}
          <div className={cn(
            'p-4 rounded-2xl transition-colors',
            isDragging ? 'gradient-primary' : 'bg-muted'
          )}>
            {isDragging ? (
              <Upload className="h-10 w-10 text-white animate-bounce" />
            ) : (
              <Film className="h-10 w-10 text-muted-foreground" />
            )}
          </div>

          {/* Text */}
          <div>
            <p className="text-lg font-semibold mb-1">
              {isDragging ? 'Drop your video here' : 'Drag & drop your dashcam video'}
            </p>
            <p className="text-muted-foreground">
              or click to browse files
            </p>
          </div>

          {/* File info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="px-3 py-1 rounded-full bg-muted">MP4</span>
            <span className="px-3 py-1 rounded-full bg-muted">MOV</span>
            <span>Max 500MB</span>
          </div>
        </div>

        {/* Gradient border effect when dragging */}
        {isDragging && (
          <div className="absolute inset-0 rounded-2xl gradient-primary opacity-20 pointer-events-none" />
        )}
      </label>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
