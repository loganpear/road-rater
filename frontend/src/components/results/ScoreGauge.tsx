import { useEffect, useState } from 'react';
import { Grade, GRADE_CONFIG } from '@/types/analysis';
import { cn } from '@/lib/utils';

interface ScoreGaugeProps {
  score: number;
  grade: Grade;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreGauge({ score, grade, size = 'lg' }: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const gradeConfig = GRADE_CONFIG[grade];
  
  const dimensions = {
    sm: { size: 120, stroke: 8, fontSize: 'text-2xl', gradeSize: 'text-sm' },
    md: { size: 180, stroke: 12, fontSize: 'text-4xl', gradeSize: 'text-lg' },
    lg: { size: 240, stroke: 16, fontSize: 'text-6xl', gradeSize: 'text-xl' },
  };

  const dim = dimensions[size];
  const radius = (dim.size - dim.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayScore / 100) * circumference;
  const offset = circumference - progress;

  // Animate score counting
  useEffect(() => {
    if (!isAnimating) return;

    const duration = 1500;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [score, isAnimating]);

  // Get gradient colors based on score
  const getGradientId = () => {
    if (score >= 80) return 'scoreGradientGood';
    if (score >= 60) return 'scoreGradientAverage';
    return 'scoreGradientPoor';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: dim.size, height: dim.size }}>
        <svg
          width={dim.size}
          height={dim.size}
          className="transform -rotate-90"
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="scoreGradientGood" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(142, 71%, 45%)" />
              <stop offset="100%" stopColor="hsl(160, 84%, 39%)" />
            </linearGradient>
            <linearGradient id="scoreGradientAverage" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(38, 92%, 50%)" />
              <stop offset="100%" stopColor="hsl(45, 93%, 47%)" />
            </linearGradient>
            <linearGradient id="scoreGradientPoor" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(0, 84%, 60%)" />
              <stop offset="100%" stopColor="hsl(25, 95%, 53%)" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle
            cx={dim.size / 2}
            cy={dim.size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={dim.stroke}
          />

          {/* Progress circle */}
          <circle
            cx={dim.size / 2}
            cy={dim.size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${getGradientId()})`}
            strokeWidth={dim.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-300"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold tabular-nums', dim.fontSize)}>
            {displayScore}
          </span>
          <span className="text-muted-foreground text-sm">out of 100</span>
        </div>
      </div>

      {/* Grade badge */}
      <div className={cn(
        'px-4 py-2 rounded-full font-bold',
        dim.gradeSize,
        score >= 80 && 'bg-success/20 text-success',
        score >= 60 && score < 80 && 'bg-warning/20 text-warning',
        score < 60 && 'bg-destructive/20 text-destructive'
      )}>
        Grade: {grade} — {gradeConfig.label}
      </div>
    </div>
  );
}
