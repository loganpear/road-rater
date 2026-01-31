import { AnalysisResult, UploadProgress, getGradeFromScore } from '@/types/analysis';

// Mock video URL (using a sample video)
const MOCK_VIDEO_URL = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4';

// Mock analysis results for demo
const MOCK_ANALYSIS: AnalysisResult = {
  id: 'analysis_demo_001',
  videoName: 'highway_commute_jan15.mp4',
  videoDuration: 180,
  videoUrl: MOCK_VIDEO_URL,
  createdAt: new Date().toISOString(),
  score: 72,
  grade: 'C',
  summary: 'Your driving shows room for improvement. Focus on maintaining safe following distances and smoother braking patterns.',
  events: [
    {
      id: 'evt_1',
      type: 'tailgating',
      timestamp: 12,
      duration: 8,
      severity: 'moderate',
      points: -5,
      description: 'Following distance dropped below 2 seconds at 45 mph',
    },
    {
      id: 'evt_2',
      type: 'harsh_braking',
      timestamp: 35,
      duration: 2,
      severity: 'high',
      points: -8,
      description: 'Sudden deceleration of 0.6g detected',
    },
    {
      id: 'evt_3',
      type: 'lane_departure',
      timestamp: 58,
      duration: 3,
      severity: 'low',
      points: -3,
      description: 'Vehicle drifted across lane marking without signal',
    },
    {
      id: 'evt_4',
      type: 'hard_acceleration',
      timestamp: 89,
      duration: 4,
      severity: 'moderate',
      points: -4,
      description: 'Rapid acceleration from traffic light exceeded safe threshold',
    },
    {
      id: 'evt_5',
      type: 'sharp_turns',
      timestamp: 125,
      duration: 2,
      severity: 'moderate',
      points: -4,
      description: 'Sharp right turn taken at higher than recommended speed',
    },
    {
      id: 'evt_6',
      type: 'tailgating',
      timestamp: 152,
      duration: 12,
      severity: 'high',
      points: -4,
      description: 'Maintained unsafe following distance for extended period',
    },
  ],
  breakdown: {
    following_distance: {
      score: 65,
      maxScore: 100,
      deductions: [
        { reason: 'Tailgating incident at 0:12', points: -5 },
        { reason: 'Extended tailgating at 2:32', points: -4 },
      ],
      tips: [
        'Maintain at least 3 seconds of following distance',
        'Increase distance in adverse weather conditions',
        'Use the "3-second rule" - pick a fixed point and count',
      ],
    },
    braking: {
      score: 70,
      maxScore: 100,
      deductions: [
        { reason: 'Harsh braking event detected', points: -8 },
      ],
      tips: [
        'Anticipate traffic flow to brake gradually',
        'Start braking earlier when approaching stops',
        'Avoid sudden stops by watching traffic ahead',
      ],
    },
    acceleration: {
      score: 80,
      maxScore: 100,
      deductions: [
        { reason: 'Hard acceleration from stop', points: -4 },
      ],
      tips: [
        'Accelerate smoothly from stops',
        'Gradual throttle application saves fuel',
        'Match the flow of traffic when merging',
      ],
    },
    lane_discipline: {
      score: 85,
      maxScore: 100,
      deductions: [
        { reason: 'Lane departure without signal', points: -3 },
      ],
      tips: [
        'Always use turn signals before changing lanes',
        'Check mirrors and blind spots',
        'Stay centered in your lane',
      ],
    },
    steering: {
      score: 80,
      maxScore: 100,
      deductions: [
        { reason: 'Sharp turn at high speed', points: -4 },
      ],
      tips: [
        'Reduce speed before entering turns',
        'Use smooth steering inputs',
        'Look through the turn to where you want to go',
      ],
    },
  },
};

// Simulates file upload and analysis
export async function uploadAndAnalyze(
  file: File,
  onProgress: (progress: UploadProgress) => void
): Promise<AnalysisResult> {
    onProgress({
    status: 'uploading',
    progress: 0,
    message: `Uploading video... 0%`,
  });

  const formData = new FormData();
  formData.append('video', file);

  const response = await fetch(API_ENDPOINTS.analyze, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown upload error' }));
    throw new Error(errorData.message || 'Failed to upload video');
  }
  
  const backgroundResponse = await response.json();


  // Simulate processing
  onProgress({
    status: 'processing',
    progress: 100,
    message: 'AI is analyzing your driving...',
  });

  await new Promise((resolve) => setTimeout(resolve, 2500));

  // Return mock result with dynamic video name
  const result: AnalysisResult = {
    ...MOCK_ANALYSIS,
    id: backgroundResponse.videoId,
    videoName: file.name,
    createdAt: new Date().toISOString(),
  };

  onProgress({
    status: 'complete',
    progress: 100,
    message: 'Analysis complete!',
    analysisId: result.id,
  });

  return result;
}

// Get analysis by ID (from localStorage cache or mock)
export function getAnalysis(id: string): AnalysisResult | null {
  // Check localStorage for cached analysis
  const cached = localStorage.getItem(`analysis_${id}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Return mock for demo
  if (id === 'demo') {
    return MOCK_ANALYSIS;
  }

  return null;
}

// Save analysis to localStorage
export function saveAnalysis(analysis: AnalysisResult): void {
  localStorage.setItem(`analysis_${analysis.id}`, JSON.stringify(analysis));
  
  // Also update recent analyses list
  const recentIds = getRecentAnalysisIds();
  if (!recentIds.includes(analysis.id)) {
    recentIds.unshift(analysis.id);
    localStorage.setItem('recent_analyses', JSON.stringify(recentIds.slice(0, 10)));
  }
}

// Get list of recent analysis IDs
export function getRecentAnalysisIds(): string[] {
  const stored = localStorage.getItem('recent_analyses');
  return stored ? JSON.parse(stored) : [];
}

// Validate video file
export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 500 * 1024 * 1024; // 500MB
  const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-m4v'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload MP4 or MOV files only.',
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is 500MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`,
    };
  }

  return { valid: true };
}

// API endpoints (for when real backend is connected)
export const API_ENDPOINTS = {
  analyze: '/api/analyze',
  getAnalysis: (id: string) => `/api/analysis/${id}`,
  getHistory: '/api/history',
};
