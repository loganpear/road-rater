import { AnalysisResult, UploadProgress, Grade } from "@/types/analysis";
import { getGradeFromScore } from "@/lib/grading";

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
  grade: 'C' as Grade,
  summary:
    'Your driving shows room for improvement. Focus on maintaining safe following distances and smoother braking patterns.',
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
      deductions: [{ reason: 'Harsh braking event detected', points: -8 }],
      tips: [
        'Anticipate traffic flow to brake gradually',
        'Start braking earlier when approaching stops',
        'Avoid sudden stops by watching traffic ahead',
      ],
    },
    acceleration: {
      score: 80,
      maxScore: 100,
      deductions: [{ reason: 'Hard acceleration from stop', points: -4 }],
      tips: ['Accelerate smoothly from stops', 'Gradual throttle application saves fuel', 'Match the flow of traffic when merging'],
    },
    lane_discipline: {
      score: 85,
      maxScore: 100,
      deductions: [{ reason: 'Lane departure without signal', points: -3 }],
      tips: ['Always use turn signals before changing lanes', 'Check mirrors and blind spots', 'Stay centered in your lane'],
    },
    steering: {
      score: 80,
      maxScore: 100,
      deductions: [{ reason: 'Sharp turn at high speed', points: -4 }],
      tips: ['Reduce speed before entering turns', 'Use smooth steering inputs', 'Look through the turn to where you want to go'],
    },
  },
};

// --- POLISHED upload + analyze ---

type UploadAndAnalyzeOptions = {
  signal?: AbortSignal;
  /** Force demo mode even if API exists */
  demo?: boolean;
};

/** Small helper */
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isAbortError(err: unknown) {
  return err instanceof DOMException && err.name === 'AbortError';
}

/**
 * Creates a "staged" progress animation that feels intentional.
 * Call `stop()` when the real job completes.
 */
function startStagedProcessing(onProgress: (p: UploadProgress) => void) {
  let stopped = false;

  const stages = [
    { pct: 12, msg: 'Extracting frames…' },
    { pct: 38, msg: 'Analyzing lane position…' },
    { pct: 62, msg: 'Detecting driving events…' },
    { pct: 84, msg: 'Computing score & breakdown…' },
    { pct: 92, msg: 'Finalizing results…' },
  ];

  (async () => {
    let current = 0;

    for (const s of stages) {
      if (stopped) return;

      while (!stopped && current < s.pct) {
        current += Math.max(1, Math.round((s.pct - current) * 0.12));
        onProgress({
          status: 'processing',
          progress: current,
          message: s.msg,
        });
        await sleep(250);
      }

      await sleep(350);
    }

    while (!stopped && current < 96) {
      current += 1;
      onProgress({
        status: 'processing',
        progress: current,
        message: 'Finishing up…',
      });
      await sleep(700);
    }
  })();

  return {
    stop() {
      stopped = true;
    },
  };
}

/**
 * Real upload using XHR so we can get upload progress events.
 */
function uploadViaXHR(
  url: string,
  file: File,
  onProgress: (p: UploadProgress) => void,
  signal?: AbortSignal
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const form = new FormData();
    form.append('file', file);

    xhr.open('POST', url);

    xhr.upload.onprogress = (evt) => {
      if (!evt.lengthComputable) return;
      const pct = Math.min(100, Math.round((evt.loaded / evt.total) * 100));
      onProgress({
        status: 'uploading',
        progress: pct,
        message: pct < 100 ? `Uploading video… ${pct}%` : 'Upload complete. Starting analysis…',
      });
    };

    xhr.onerror = () => reject(new Error('Network error during upload.'));
    xhr.onabort = () => reject(new DOMException('Upload aborted', 'AbortError'));

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve(xhr.responseText);
        }
      } else {
        reject(new Error(`Upload failed (${xhr.status}).`));
      }
    };

    const abortHandler = () => xhr.abort();
    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return;
      }
      signal.addEventListener('abort', abortHandler, { once: true });
    }

    xhr.send(form);
  });
}

export async function uploadAndAnalyze(
  file: File,
  onProgress: (progress: UploadProgress) => void,
  options: UploadAndAnalyzeOptions = {}
): Promise<AnalysisResult> {
  const { signal, demo } = options;

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  // DEMO mode
  if (demo) {
    onProgress({ status: 'uploading', progress: 0, message: 'Uploading video…' });
    for (let i = 0; i <= 100; i += 5) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      await sleep(80);
      onProgress({
        status: 'uploading',
        progress: i,
        message: i < 100 ? `Uploading video… ${i}%` : 'Upload complete. Starting analysis…',
      });
    }

    const staged = startStagedProcessing(onProgress);
    await sleep(2200);
    staged.stop();

    const result: AnalysisResult = {
      ...MOCK_ANALYSIS,
      id: `analysis_${Date.now()}`,
      videoName: file.name,
      createdAt: new Date().toISOString(),
    };

    onProgress({ status: 'complete', progress: 100, message: 'Analysis complete!', analysisId: result.id });
    return result;
  }

  // REAL mode (backend)
  onProgress({ status: 'uploading', progress: 0, message: 'Uploading video…' });

  let stagedController: ReturnType<typeof startStagedProcessing> | null = null;

  try {
    const response = await uploadViaXHR(API_ENDPOINTS.analyze, file, onProgress, signal);

    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    // If backend returns AnalysisResult directly
    if (response?.score !== undefined && response?.events) {
      const result = response as AnalysisResult;
      if (!result.grade) result.grade = getGradeFromScore(result.score);
      onProgress({ status: 'complete', progress: 100, message: 'Analysis complete!', analysisId: result.id });
      return result;
    }

    // If backend returns a job id, poll until complete
    if (response?.jobId) {
      const jobId = response.jobId as string;

      stagedController = startStagedProcessing(onProgress);

      while (true) {
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

        const jobUrl = API_ENDPOINTS.getJob(jobId);
        const statusRes = await fetch(jobUrl, { signal });

        if (!statusRes.ok) {
          const text = await statusRes.text().catch(() => '');
          throw new Error(
            `Failed to fetch processing status (${statusRes.status} ${statusRes.statusText}) from ${jobUrl}. ` +
              (text ? `Body: ${text}` : '')
          );
        }

        const statusJson = await statusRes.json();

        if (statusJson.status === 'error') {
          throw new Error(statusJson.message || 'Processing failed.');
        }

        // If backend includes the result directly in job completion, accept it
        if (statusJson.status === 'complete' && statusJson.result) {
          stagedController.stop();
          const result = statusJson.result as AnalysisResult;
          if (!result.grade) result.grade = getGradeFromScore(result.score);
          onProgress({ status: 'complete', progress: 100, message: 'Analysis complete!', analysisId: result.id });
          return result;
        }

        // If backend returns a resultId, fetch analysis from /api/analysis/:id
        if (statusJson.status === 'complete' && statusJson.resultId) {
          stagedController.stop();

          const resultUrl = API_ENDPOINTS.getAnalysis(String(statusJson.resultId));
          const resultRes = await fetch(resultUrl, { signal });

          if (!resultRes.ok) {
            const text = await resultRes.text().catch(() => '');
            throw new Error(
              `Failed to fetch analysis result (${resultRes.status} ${resultRes.statusText}) from ${resultUrl}. ` +
                (text ? `Body: ${text}` : '')
            );
          }

          const result = (await resultRes.json()) as AnalysisResult;

          if (!result.grade) result.grade = getGradeFromScore(result.score);

          onProgress({ status: 'complete', progress: 100, message: 'Analysis complete!', analysisId: result.id });
          return result;
        }

        if (typeof statusJson.progress === 'number') {
          onProgress({
            status: 'processing',
            progress: Math.max(10, Math.min(99, Math.round(statusJson.progress))),
            message: statusJson.message || 'Analyzing…',
          });
        }

        await sleep(900);
      }
    }

    stagedController?.stop();
    throw new Error('Unexpected response from server.');
  } catch (err) {
    stagedController?.stop();
    if (isAbortError(err)) throw err;
    throw err instanceof Error ? err : new Error('Upload failed.');
  }
}

// ------------------------------
// Backend fetch helpers
// ------------------------------

type FetchOptions = {
  signal?: AbortSignal;
};

/** Fetch an analysis from the backend and cache it in localStorage. */
export async function fetchAnalysis(id: string, options: FetchOptions = {}): Promise<AnalysisResult> {
  const url = API_ENDPOINTS.getAnalysis(id);
  const res = await fetch(url, { signal: options.signal });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      res.status === 404
        ? `Analysis not found (404) at ${url}. ${text}`
        : `Failed to load analysis (${res.status}) at ${url}. ${text}`
    );
  }
  const analysis = (await res.json()) as AnalysisResult;
  if (!analysis.grade) analysis.grade = getGradeFromScore(analysis.score);
  saveAnalysis(analysis);
  return analysis;
}

/** Fetch recent analyses from the backend (optional UI). */
export async function fetchHistory(options: FetchOptions = {}): Promise<AnalysisResult[]> {
  const url = API_ENDPOINTS.getHistory;
  const res = await fetch(url, { signal: options.signal });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to load history (${res.status}) at ${url}. ${text}`);
  }
  const items = (await res.json()) as AnalysisResult[];
  for (const item of items) {
    if (!item.grade) item.grade = getGradeFromScore(item.score);
    saveAnalysis(item);
  }
  return items;
}

// Get analysis by ID (from localStorage cache or mock)
export function getAnalysis(id: string): AnalysisResult | null {
  const cached = localStorage.getItem(`analysis_${id}`);
  if (cached) {
    return JSON.parse(cached);
  }

  if (id === 'demo') {
    return MOCK_ANALYSIS;
  }

  return null;
}

// Save analysis to localStorage
export function saveAnalysis(analysis: AnalysisResult): void {
  localStorage.setItem(`analysis_${analysis.id}`, JSON.stringify(analysis));

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
  getJob: (jobId: string) => `/api/jobs/${jobId}`,
  getAnalysis: (id: string) => `/api/analysis/${id}`,
  getHistory: '/api/history',
} as const;
