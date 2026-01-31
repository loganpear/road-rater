import { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { DrivingEvent, formatDuration, EVENT_CONFIG } from '@/types/analysis';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  videoUrl: string;
  duration: number;
  events: DrivingEvent[];
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
}

export function VideoPlayer({ videoUrl, duration, events, currentTime, onTimeUpdate }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [internalTime, setInternalTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Scrubbing (dragging the timeline thumb) can cause perceived playback jitter
  // if we continuously seek while dragging. We track scrub state and only seek
  // on commit.
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);

  // Avoid feedback-loop jitter: the parent updates currentTime from onTimeUpdate,
  // which can cause us to keep setting video.currentTime on every render.
  // We only apply external time when it meaningfully differs (i.e., a real seek).
  const lastAppliedExternalRef = useRef<number | null>(null);
  const lastReportedTimeRef = useRef<number>(-1);

  const displayTime = currentTime ?? internalTime;
  const safeDuration = Math.max(duration, 0.001);

  // Sync external time changes
  useEffect(() => {
    if (currentTime !== undefined && videoRef.current) {
      const el = videoRef.current;
      const diff = Math.abs(el.currentTime - currentTime);

      // Ignore tiny diffs (often caused by parent state updates) to prevent stutter.
      if (diff < 0.05) return;

      // If playing, only apply a larger correction to avoid micro-seeks.
      if (!el.paused && diff < 0.25) return;

      // Also avoid re-applying the exact same external time repeatedly.
      if (lastAppliedExternalRef.current !== null && Math.abs(lastAppliedExternalRef.current - currentTime) < 0.01) {
        return;
      }

      el.currentTime = currentTime;
      lastAppliedExternalRef.current = currentTime;
    }
  }, [currentTime]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;

      // Reduce render pressure by only updating state when time changes enough.
      // (Video timeupdate can fire frequently.)
      if (Math.abs(time - lastReportedTimeRef.current) >= 0.05) {
        lastReportedTimeRef.current = time;
        setInternalTime(time);
        onTimeUpdate?.(time);
      }
    }
  }, [onTimeUpdate]);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
      return;
    }

    const p = el.play();
    // Some browsers block play() without a user gesture; avoid noisy console errors.
    if (p && typeof (p as Promise<void>).catch === 'function') {
      (p as Promise<void>).catch(() => {
        setIsPlaying(false);
      });
    }
    setIsPlaying(true);
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleSeekCommit = useCallback((value: number[]) => {
    const t = value?.[0] ?? 0;
    if (videoRef.current) {
      videoRef.current.currentTime = t;
      setInternalTime(t);
      onTimeUpdate?.(t);
    }
    setIsScrubbing(false);
  }, [onTimeUpdate]);

  const handleSeekChange = useCallback((value: number[]) => {
    const t = value?.[0] ?? 0;
    setIsScrubbing(true);
    setScrubTime(t);
  }, []);

  const handlePlaybackRate = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  }, []);

  const handleFullscreen = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
  }, []);

  const restart = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setInternalTime(0);
      onTimeUpdate?.(0);
    }
  }, [onTimeUpdate]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-black group">
      {/* Video element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full aspect-video"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Controls overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Center play button */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors">
            {isPlaying ? (
              <Pause className="h-8 w-8 text-white" />
            ) : (
              <Play className="h-8 w-8 text-white ml-1" />
            )}
          </div>
        </button>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          {/* Progress bar with event markers */}
          <div className="relative">
            <Slider
              value={[isScrubbing ? scrubTime : displayTime]}
              max={safeDuration}
              step={0.1}
              onValueChange={handleSeekChange}
              onValueCommit={handleSeekCommit}
              className="cursor-pointer"
            />

            {/* Event markers */}
            {events.map((event) => {
              const position = Math.min(100, Math.max(0, (event.timestamp / safeDuration) * 100));
              const config = EVENT_CONFIG[event.type];
              return (
                <button
                  key={event.id}
                  className="absolute top-1/2 w-3 h-3 rounded-full border-2 border-white cursor-pointer hover:scale-150 transition-transform z-10"
                  style={{
                    left: `${position}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: config.color,
                  }}
                  onClick={() => handleSeekCommit([event.timestamp])}
                  title={`${config.label} at ${formatDuration(event.timestamp)}`}
                  aria-label={`Jump to ${config.label} at ${formatDuration(event.timestamp)}`}
                />
              );
            })}
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={restart}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>

              <span className="text-white text-sm ml-2">
                {formatDuration(displayTime)} / {formatDuration(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Playback speed */}
              <div className="flex items-center gap-1 text-white text-sm">
                {[0.5, 1, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handlePlaybackRate(rate)}
                    className={cn(
                      'px-2 py-1 rounded transition-colors',
                      playbackRate === rate ? 'bg-white text-black' : 'hover:bg-white/20'
                    )}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={handleFullscreen}
              >
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
