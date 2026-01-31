import { DrivingEvent, EVENT_CONFIG, formatDuration } from '@/types/analysis';
import { cn } from '@/lib/utils';

interface EventTimelineProps {
  events: DrivingEvent[];
  duration: number;
  currentTime: number;
  onEventClick: (timestamp: number) => void;
}

export function EventTimeline({ events, duration, currentTime, onEventClick }: EventTimelineProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Event Timeline</h3>
      
      {/* Visual timeline */}
      <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
        {/* Progress indicator */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-primary/20"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
        
        {/* Current time marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary z-20"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />

        {/* Event markers */}
        {events.map((event) => {
          const left = (event.timestamp / duration) * 100;
          const width = (event.duration / duration) * 100;
          const config = EVENT_CONFIG[event.type];
          
          return (
            <button
              key={event.id}
              className="absolute top-1 bottom-1 rounded cursor-pointer hover:opacity-80 transition-opacity group"
              style={{
                left: `${left}%`,
                width: `${Math.max(width, 1)}%`,
                backgroundColor: config.color,
                minWidth: '8px',
              }}
              onClick={() => onEventClick(event.timestamp)}
              aria-label={`${config.label} at ${formatDuration(event.timestamp)}`}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  {config.icon} {config.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0:00</span>
        <span>{formatDuration(duration / 2)}</span>
        <span>{formatDuration(duration)}</span>
      </div>

      {/* Event list */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
        {events.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No events detected</p>
        ) : (
          events.map((event) => {
            const config = EVENT_CONFIG[event.type];
            const isActive = currentTime >= event.timestamp && currentTime < event.timestamp + event.duration;
            
            return (
              <button
                key={event.id}
                onClick={() => onEventClick(event.timestamp)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                  isActive
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card/50 hover:border-primary/50'
                )}
              >
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${config.color}20` }}
                >
                  {config.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{config.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDuration(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {event.description}
                  </p>
                </div>

                <div className={cn(
                  'flex-shrink-0 px-2 py-1 rounded text-xs font-medium',
                  event.severity === 'high' && 'bg-destructive/20 text-destructive',
                  event.severity === 'moderate' && 'bg-warning/20 text-warning',
                  event.severity === 'low' && 'bg-muted text-muted-foreground'
                )}>
                  {event.points} pts
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
