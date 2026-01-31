import { Loader2, CheckCircle, AlertCircle, Brain, Upload as UploadIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { UploadProgress as UploadProgressType } from '@/types/analysis';
import { cn } from '@/lib/utils';

interface UploadProgressProps {
  progress: UploadProgressType;
  fileName: string;
  onCancel?: () => void;
}

export function UploadProgress({ progress, fileName, onCancel }: UploadProgressProps) {
  const isUploading = progress.status === 'uploading';
  const isProcessing = progress.status === 'processing';
  const isComplete = progress.status === 'complete';
  const isError = progress.status === 'error';

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* File info card */}
      <div className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            'p-3 rounded-xl transition-colors',
            isComplete ? 'bg-success/20' : isError ? 'bg-destructive/20' : 'gradient-primary'
          )}>
            {isComplete ? (
              <CheckCircle className="h-6 w-6 text-success" />
            ) : isError ? (
              <AlertCircle className="h-6 w-6 text-destructive" />
            ) : isProcessing ? (
              <Brain className="h-6 w-6 text-white animate-pulse" />
            ) : (
              <UploadIcon className="h-6 w-6 text-white" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{fileName}</p>
            <p className={cn(
              'text-sm',
              isComplete ? 'text-success' : isError ? 'text-destructive' : 'text-muted-foreground'
            )}>
              {progress.message || 'Preparing...'}
            </p>
          </div>

          {/* Cancel button */}
          {(isUploading || isProcessing) && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-muted-foreground hover:text-destructive"
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Progress bar */}
        {!isComplete && !isError && (
          <div className="mt-4 space-y-2">
            <Progress value={progress.progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{isProcessing ? 'Analyzing...' : 'Uploading...'}</span>
              <span>{progress.progress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Processing animation */}
      {isProcessing && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="relative">
            <div className="absolute inset-0 gradient-primary rounded-full blur-xl opacity-30 animate-pulse" />
            <div className="relative gradient-primary p-6 rounded-full">
              <Brain className="h-12 w-12 text-white animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg">AI is analyzing your driving</p>
            <p className="text-muted-foreground">This typically takes 10-30 seconds</p>
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Detecting events...</span>
          </div>
        </div>
      )}

      {/* Success message */}
      {isComplete && (
        <div className="flex flex-col items-center gap-4 py-8 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 bg-success rounded-full blur-xl opacity-30" />
            <div className="relative bg-success p-6 rounded-full">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg text-success">Analysis Complete!</p>
            <p className="text-muted-foreground">Redirecting to your results...</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {isError && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="relative">
            <div className="absolute inset-0 bg-destructive rounded-full blur-xl opacity-30" />
            <div className="relative bg-destructive p-6 rounded-full">
              <AlertCircle className="h-12 w-12 text-white" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg text-destructive">Upload Failed</p>
            <p className="text-muted-foreground">{progress.message || 'Please try again'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
