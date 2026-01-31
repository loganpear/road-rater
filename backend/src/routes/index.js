import { Router } from "express";
import multer from "multer";
import fs from "node:fs";

import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { makeId } from "../utils/id.js";
import {
  createJob,
  updateJob,
  getJob,
  setAnalysis,
  getAnalysis,
  listAnalyses,
  nowIso
} from "../db/index.js";

export const router = Router();

// Ensure upload directory exists
fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });

const upload = multer({
  dest: env.UPLOAD_DIR,
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 }
});

// Build a mock analysis (swap later with real pipeline)
function buildMockAnalysis({ analysisId, originalName, storedFilename }) {
  const videoUrl = `/uploads/${storedFilename}`; // served as static in app.js

  return {
    id: analysisId,
    videoName: originalName,
    videoDuration: 0,
    videoUrl,
    createdAt: nowIso(),
    score: 72,
    grade: "C",
    summary:
      "Your driving shows room for improvement. Focus on maintaining safe following distances and smoother braking patterns.",
    events: [
      {
        id: "evt_1",
        type: "tailgating",
        timestamp: 12,
        duration: 8,
        severity: "moderate",
        points: -5,
        description: "Following distance dropped below 2 seconds at 45 mph"
      },
      {
        id: "evt_2",
        type: "harsh_braking",
        timestamp: 35,
        duration: 2,
        severity: "high",
        points: -8,
        description: "Sudden deceleration detected"
      }
    ],
    breakdown: {
      following_distance: {
        score: 65,
        maxScore: 100,
        deductions: [
          { reason: "Tailgating incident at 0:12", points: -5 },
          { reason: "Extended tailgating at 2:32", points: -4 }
        ],
        tips: [
          "Maintain at least 3 seconds of following distance",
          "Increase distance in adverse weather conditions",
          "Use the 3-second rule"
        ]
      },
      braking: {
        score: 70,
        maxScore: 100,
        deductions: [{ reason: "Harsh braking event detected", points: -8 }],
        tips: [
          "Anticipate traffic flow to brake gradually",
          "Start braking earlier when approaching stops",
          "Watch traffic ahead"
        ]
      },
      acceleration: {
        score: 80,
        maxScore: 100,
        deductions: [{ reason: "Hard acceleration from stop", points: -4 }],
        tips: [
          "Accelerate smoothly from stops",
          "Gradual throttle application saves fuel",
          "Match the flow of traffic when merging"
        ]
      },
      lane_discipline: {
        score: 85,
        maxScore: 100,
        deductions: [{ reason: "Lane departure without signal", points: -3 }],
        tips: ["Always use turn signals", "Check mirrors and blind spots", "Stay centered in your lane"]
      },
      steering: {
        score: 80,
        maxScore: 100,
        deductions: [{ reason: "Sharp turn at high speed", points: -4 }],
        tips: ["Reduce speed before entering turns", "Use smooth steering inputs", "Look where you want to go"]
      }
    }
  };
}

// Health check
router.get("/health", (_req, res) => {
  res.json({ ok: true, time: nowIso() });
});

/**
 * POST /api/analyze
 * Frontend sends multipart form-data with field name: "file"
 * Response: { jobId }
 */
router.post("/analyze", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No video file uploaded." });

    const jobId = makeId("job");
    const analysisId = makeId("analysis");

    createJob({
      jobId,
      analysisId,
      originalName: req.file.originalname,
      storedFilename: req.file.filename
    });

    // Respond immediately so frontend can poll
    res.status(202).json({ jobId });

    // Background simulation (replace with real inference)
    setTimeout(() => updateJob(jobId, { status: "processing", progress: 25, message: "Extracting frames…" }), 500);
    setTimeout(() => updateJob(jobId, { status: "processing", progress: 60, message: "Detecting events…" }), 1400);

    setTimeout(() => {
      try {
        const analysis = buildMockAnalysis({
          analysisId,
          originalName: req.file.originalname,
          storedFilename: req.file.filename
        });

        setAnalysis(analysis);
        updateJob(jobId, { status: "complete", progress: 100, message: "Complete" });
      } catch (e) {
        logger.error("Finalize job failed", e);
        // Frontend expects status === "error" to stop polling
        updateJob(jobId, { status: "error", message: "Processing failed" });
      }
    }, 2600);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/jobs/:jobId
 */
router.get("/jobs/:jobId", (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ status: "error", message: "Job not found" });
  res.json({ status: job.status, progress: job.progress, message: job.message, resultId: job.resultId });
});

/**
 * GET /api/analysis/:id
 */
router.get("/analysis/:id", (req, res) => {
  const analysis = getAnalysis(req.params.id);
  if (!analysis) return res.status(404).json({ error: "Analysis not found" });
  res.json(analysis);
});

/**
 * GET /api/history
 */
router.get("/history", (_req, res) => {
  res.json(listAnalyses(25));
});
