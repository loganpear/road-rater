export type CategoryScore = {
  score: number;
  maxScore: number;
  deductions: { reason: string; points: number }[];
  tips: string[];
};

export type Severity = 'low' | 'moderate' | 'high';

export type Grade =
  | 'A' | 'A-'
  | 'B+' | 'B' | 'B-'
  | 'C+' | 'C' | 'C-'
  | 'D+' | 'D' | 'D-'
  | 'F';

// ✅ includes new backend type "lane_discipline"
export type EventType =
  | 'tailgating'
  | 'harsh_braking'
  | 'hard_acceleration'
  | 'lane_departure'
  | 'lane_discipline'
  | 'sharp_turns';

// ✅ referenced by Analysis/AnalysisResult
export type DrivingEvent = {
  id: string;
  type: EventType | (string & {}); // allows known + future backend types without breaking builds
  timestamp: number;
  duration?: number;
  severity?: Severity;
  points?: number;
  description?: string;
};

// ✅ supports your backend debug payload
export type AnalysisDebug = {
  onLineTimestamps?: number[];
  onLineSegments?: Array<{
    startTime: number;
    endTime: number;
    duration: number;
    worstClearancePx: number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

export type Analysis = {
  id: string;
  videoName: string;
  videoDuration: number;
  videoUrl: string;
  createdAt: string;
  score: number;
  grade: Grade; // ✅ was string
  summary: string;
  events: DrivingEvent[];
  breakdown: Record<string, CategoryScore>;
  debug?: AnalysisDebug;
};

export interface ScoreBreakdown {
  following_distance: CategoryScore;
  braking: CategoryScore;
  acceleration: CategoryScore;
  lane_discipline: CategoryScore;
  steering: CategoryScore;
}

export interface AnalysisResult {
  id: string;
  videoName: string;
  videoDuration: number; // total seconds
  videoUrl: string;
  createdAt: string;
  score: number;
  grade: Grade;
  summary: string;
  events: DrivingEvent[];
  breakdown: ScoreBreakdown;
  debug?: AnalysisDebug; // ✅ add so it matches Analysis shape & backend payload
}

export interface UploadProgress {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number; // 0-100
  message?: string;
  analysisId?: string;
}

export const EVENT_CONFIG: Record<EventType, { label: string; icon: string; color: string }> = {
  tailgating: {
    label: 'Tailgating',
    icon: '🚗',
    color: 'hsl(var(--event-tailgating))',
  },
  harsh_braking: {
    label: 'Harsh Braking',
    icon: '🛑',
    color: 'hsl(var(--event-harsh-braking))',
  },
  hard_acceleration: {
    label: 'Hard Acceleration',
    icon: '⚡',
    color: 'hsl(var(--event-hard-acceleration))',
  },
  lane_departure: {
    label: 'Lane Departure',
    icon: '↗️',
    color: 'hsl(var(--event-lane-departure))',
  },
  // ✅ new entry
  lane_discipline: {
    label: 'Lane Discipline',
    icon: '🛣️',
    color: 'hsl(var(--event-lane-discipline))',
  },
  sharp_turns: {
    label: 'Sharp Turns',
    icon: '🔄',
    color: 'hsl(var(--event-sharp-turns))',
  },
};

export const GRADE_CONFIG: Record<Grade, { minScore: number; label: string; colorClass: string }> = {
  'A': { minScore: 95, label: 'Excellent', colorClass: 'gradient-score-a' },
  'A-': { minScore: 90, label: 'Excellent', colorClass: 'gradient-score-a' },
  'B+': { minScore: 87, label: 'Great', colorClass: 'gradient-score-b' },
  'B': { minScore: 83, label: 'Good', colorClass: 'gradient-score-b' },
  'B-': { minScore: 80, label: 'Good', colorClass: 'gradient-score-b' },
  'C+': { minScore: 77, label: 'Average', colorClass: 'gradient-score-c' },
  'C': { minScore: 73, label: 'Average', colorClass: 'gradient-score-c' },
  'C-': { minScore: 70, label: 'Average', colorClass: 'gradient-score-c' },
  'D+': { minScore: 67, label: 'Below Average', colorClass: 'gradient-score-d' },
  'D': { minScore: 63, label: 'Poor', colorClass: 'gradient-score-d' },
  'D-': { minScore: 60, label: 'Poor', colorClass: 'gradient-score-d' },
  'F': { minScore: 0, label: 'Failing', colorClass: 'gradient-score-f' },
};

export function getGradeFromScore(score: number): Grade {
  if (score >= 95) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 63) return 'D';
  if (score >= 60) return 'D-';
  return 'F';
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
