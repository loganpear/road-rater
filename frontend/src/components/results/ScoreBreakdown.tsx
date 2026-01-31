import { ScoreBreakdown as ScoreBreakdownType } from '@/types/analysis';
import { ScoreCard } from './ScoreCard';

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdownType;
}

const CATEGORIES = [
  {
    key: 'following_distance' as const,
    title: 'Following Distance',
    icon: '🚗',
    color: 'hsl(25, 95%, 53%)',
  },
  {
    key: 'braking' as const,
    title: 'Braking',
    icon: '🛑',
    color: 'hsl(0, 84%, 60%)',
  },
  {
    key: 'acceleration' as const,
    title: 'Acceleration',
    icon: '⚡',
    color: 'hsl(45, 93%, 47%)',
  },
  {
    key: 'lane_discipline' as const,
    title: 'Lane Discipline',
    icon: '↗️',
    color: 'hsl(217, 91%, 60%)',
  },
  {
    key: 'steering' as const,
    title: 'Steering',
    icon: '🔄',
    color: 'hsl(263, 70%, 58%)',
  },
];

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Score Breakdown</h3>
        <p className="text-sm text-muted-foreground">Click to expand details</p>
      </div>
      
      <div className="grid gap-3">
        {CATEGORIES.map((cat) => (
          <ScoreCard
            key={cat.key}
            title={cat.title}
            icon={cat.icon}
            category={breakdown[cat.key]}
            color={cat.color}
          />
        ))}
      </div>
    </div>
  );
}
