import { useEffect, useMemo, useRef } from 'react';
import type { DrivingEvent } from '@/types/analysis';
import { getEventMeta } from '@/lib/eventMeta';

type Props = {
  videoUrl: string;
  /** Total duration in seconds (used for UI + guards). */
  duration: number;
  events?: DrivingEvent[];
  /** Current playback time (seconds). Used for external seeks (timeline clicks). */
  currentTime: number;
  /** Fires as the video plays/scrubs. */
  onTimeUpdate?: (time: number) => void;
};

/**
 * Controlled-ish video player:
 * - the <video> element is the source of truth for playback
 * - `currentTime` prop is only used to seek when the user clicks timeline/events
 * - `onTimeUpdate` keeps the parent in sync without causing seek-jitter
 */
export function VideoPlayer({ videoUrl, duration, events, currentTime, onTimeUpdate }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastPropSeekRef = useRef<number>(-1);

  const safeEvents = useMemo(() => events ?? [], [events]);

  // Seek when parent requests a new time (e.g., timeline/event click).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!Number.isFinite(currentTime)) return;

    // Clamp to known duration when possible.
    const next = Math.max(0, duration > 0 ? Math.min(duration, currentTime) : currentTime);

    // Avoid feedback loop: if we already sought to this value, don't re-apply.
    if (Math.abs(lastPropSeekRef.current - next) < 0.01) return;

    // Only seek if the delta is meaningful; tiny deltas cause visible jitter.
    if (Math.abs(v.currentTime - next) > 0.35) {
      lastPropSeekRef.current = next;
      try {
        v.currentTime = next;
        // Autoplay after click feels better; ignore if browser blocks.
        void v.play().catch(() => {});
      } catch {
        // ignore
      }
    }
  }, [currentTime, duration, videoUrl]);

  function seekTo(sec: number) {
    const v = videoRef.current;
    if (!v) return;
    const next = Math.max(0, duration > 0 ? Math.min(duration, sec) : sec);
    lastPropSeekRef.current = next;
    v.currentTime = next;
    void v.play().catch(() => {});
    onTimeUpdate?.(next);
  }

  return (
    <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold">Video</h3>
        <p className="text-sm text-muted-foreground">Click an event to jump to it</p>
      </div>

      <div className="p-4 space-y-3">
        <video
          ref={videoRef}
          className="w-full rounded-lg"
          controls
          playsInline
          preload="metadata"
          src={videoUrl}
          onTimeUpdate={(e) => {
            const t = (e.currentTarget as HTMLVideoElement).currentTime;
            onTimeUpdate?.(t);
          }}
        />

        {safeEvents.length > 0 && (
          <div className="space-y-2">
            {safeEvents.map((e) => {
              const meta = getEventMeta(e.type);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => seekTo(e.timestamp)}
                  className="w-full text-left flex items-center gap-3 p-2 rounded-lg border border-border hover:bg-muted/50 transition"
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                  <div className="text-sm font-medium">{meta.label}</div>
                  <div className="ml-auto text-sm text-muted-foreground">{formatTimestamp(e.timestamp)}</div>
                </button>
              );
            })}
          </div>
        )}

        {safeEvents.length === 0 && <div className="text-sm text-muted-foreground"></div>}
      </div>
    </div>
  );
}

function formatTimestamp(seconds: number) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
