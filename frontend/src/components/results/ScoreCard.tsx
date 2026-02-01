import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { useMemo, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { CategoryScore } from "@/types/analysis";

interface ScoreCardProps {
  title: string;
  icon: React.ReactNode;      // allows emoji or <Icon />
  category?: CategoryScore;   // optional: avoids crash while loading
  color: string;
}

const FALLBACK: CategoryScore = {
  score: 0,
  maxScore: 100,
  deductions: [],
  tips: [],
};

export function ScoreCard({ title, icon, category, color }: ScoreCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const safe = category ?? FALLBACK;

  const percentage = useMemo(() => {
    const max = safe.maxScore || 100;
    const pct = (safe.score / max) * 100;
    return Math.max(0, Math.min(100, pct));
  }, [safe.score, safe.maxScore]);

  const deductions = safe.deductions ?? [];
  const tips = safe.tips ?? [];

  return (
    <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            {icon}
          </div>

          <div className="text-left">
            <h4 className="font-semibold">{title}</h4>
            <p className="text-sm text-muted-foreground">
              {safe.score}/{safe.maxScore} points
              {!category && <span className="ml-2 opacity-70">(not available)</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-24">
            <Progress value={percentage} className="h-2" />
          </div>

          <span
            className={cn(
              "font-bold text-lg w-12 text-right",
              percentage >= 80 && "text-success",
              percentage >= 60 && percentage < 80 && "text-warning",
              percentage < 60 && "text-destructive"
            )}
          >
            {safe.score}
          </span>

          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in">
          {deductions.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-2">
                Point Deductions
              </h5>
              <div className="space-y-2">
                {deductions.map((d, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-destructive/10 border border-destructive/20"
                  >
                    <span className="text-sm">{d.reason}</span>
                    <span className="text-sm font-medium text-destructive">
                      {d.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tips.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                Tips to Improve
              </h5>
              <ul className="space-y-1">
                {tips.map((tip, index) => (
                  <li
                    key={index}
                    className="text-sm text-muted-foreground pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary"
                  >
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {deductions.length === 0 && tips.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No details available for this category yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
