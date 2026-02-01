// src/lib/eventMeta.ts

type EventMeta = {
  label: string;
  color: string;
};

const EVENT_META: Record<string, EventMeta> = {
  tailgating: { label: 'Tailgating', color: '#f97316' },
  harsh_braking: { label: 'Harsh braking', color: '#ef4444' },
  hard_acceleration: { label: 'Hard acceleration', color: '#f59e0b' },
  lane_departure: { label: 'Lane departure', color: '#a855f7' },
  sharp_turns: { label: 'Sharp turns', color: '#22c55e' },

  // ✅ Your new event type coming from backend
  lane_discipline: { label: 'Lane discipline', color: '#3b82f6' },
};

export function getEventMeta(type: string): EventMeta {
  return (
    EVENT_META[type] ?? {
      label: prettify(type),
      color: '#94a3b8', // default slate
    }
  );
}

function prettify(type: string) {
  return String(type || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
