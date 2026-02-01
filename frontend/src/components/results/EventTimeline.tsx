import { getEventMeta } from '@/lib/eventMeta';

type EventItem = {
  id: string;
  type: string;
  timestamp: number;
  duration?: number;
  severity?: string;
  points?: number;
  description?: string;
};

type Props = {
  events?: EventItem[];
  /** Total video duration in seconds */
  duration: number;
  /** Current playback time in seconds */
  currentTime: number;
  /** Called when the user clicks an event marker/list item */
  onEventClick: (timestamp: number) => void;
};

export function EventTimeline({ events, duration, currentTime, onEventClick }: Props) {
  const safeEvents = events ?? [];

  if (safeEvents.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-4 text-sm text-muted-foreground">
        No events detected yet.
      </div>
    );
  }

  const d = Math.max(0.0001, duration || 0.0001);
  const progressPct = Math.max(0, Math.min(100, (currentTime / d) * 100));

  return (
    <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold">Event Timeline</h3>
        <p className="text-sm text-muted-foreground">Click a marker to jump in the video</p>
      </div>

      {/* Timeline bar */}
      <div className="p-4">
        <div className="relative h-3 rounded-full bg-muted overflow-hidden">
          <div className="absolute left-0 top-0 h-full bg-primary/40" style={{ width: `${progressPct}%` }} />
          {/* Current time needle */}
          <div
            className="absolute top-0 h-full w-0.5 bg-primary"
            style={{ left: `calc(${progressPct}% - 1px)` }}
            aria-hidden
          />

          {/* Event markers */}
          {safeEvents.map((e) => {
            const meta = getEventMeta(e.type);
            const leftPct = Math.max(0, Math.min(100, (e.timestamp / d) * 100));
            return (
              <button
                key={`marker_${e.id}`}
                type="button"
                title={`${meta.label} @ ${formatTimestamp(e.timestamp)}`}
                onClick={() => onEventClick(e.timestamp)}
                className="absolute -top-1.5 h-6 w-3 -translate-x-1/2 rounded-md border border-border bg-background/70 hover:bg-background transition"
                style={{ left: `${leftPct}%` }}
              >
                <span className="block h-full w-full rounded-md" style={{ backgroundColor: meta.color, opacity: 0.8 }} />
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatTimestamp(currentTime)}</span>
          <span>{formatTimestamp(duration)}</span>
        </div>
      </div>

      {/* Event list */}
      <div className="divide-y divide-border">
        {safeEvents.map((e) => {
          const meta = getEventMeta(e.type);
          const isActive = Math.abs((e.timestamp ?? 0) - (currentTime ?? 0)) < 1.5;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => onEventClick(e.timestamp)}
              className={`w-full text-left p-4 flex items-start gap-3 hover:bg-muted/40 transition ${
                isActive ? 'bg-muted/30' : ''
              }`}
            >
              <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: meta.color }} />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div className="font-medium">{meta.label}</div>
                  <div className="text-sm text-muted-foreground">{formatTimestamp(e.timestamp)}</div>
                </div>
                {e.description && <div className="text-sm text-muted-foreground mt-1">{e.description}</div>}
              </div>
            </button>
          );
        })}
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
