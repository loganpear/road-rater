import { Router } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import sharp from "sharp";

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

// -------------------- ONNX session singleton (ESM-safe) --------------------
const require = createRequire(import.meta.url);
const ort = require("onnxruntime-node");

const MODEL_PATH = env.ONNX_MODEL_PATH || "src/models/yolop-640-640.onnx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// this file is in: backend/src/routes/index.js -> backend root is two levels up
const BACKEND_ROOT = path.resolve(__dirname, "..", "..");

function resolveModelPath(p) {
  if (path.isAbsolute(p)) return p;
  return path.resolve(BACKEND_ROOT, p);
}

let sessionPromise = null;

function getOnnxSession() {
  if (!sessionPromise) {
    const modelPath = resolveModelPath(MODEL_PATH);

    if (!fs.existsSync(modelPath)) {
      throw new Error(`ONNX model not found at: ${modelPath}`);
    }

    logger.info(`Loading ONNX: ${modelPath}`);
    sessionPromise = ort.InferenceSession.create(modelPath, {
      executionProviders: ["cpu"],
    });
  }
  return sessionPromise;
}

// -------------------- preprocess --------------------
async function preprocessToNCHWFloat32(rgbFrameBuffer, srcW, srcH, dstW, dstH) {
  const resized = await sharp(rgbFrameBuffer, {
    raw: { width: srcW, height: srcH, channels: 3 }
  })
    .resize(dstW, dstH, { kernel: "nearest" })
    .raw()
    .toBuffer();

  const hw = dstW * dstH;
  const out = new Float32Array(3 * hw);

  for (let i = 0; i < hw; i++) {
    out[i]          = resized[i * 3 + 0] / 255.0; // R
    out[hw + i]     = resized[i * 3 + 1] / 255.0; // G
    out[2 * hw + i] = resized[i * 3 + 2] / 255.0; // B
  }

  return new ort.Tensor("float32", out, [1, 3, dstH, dstW]);
}

// -------------------- pick lane output --------------------
function pickLaneTensor(resultMap, session) {
  const names = session.outputNames || [];
  if (names.length >= 3) return resultMap[names[2]];

  const keyByName = names.find(n => /ll|lane/i.test(n));
  if (keyByName) return resultMap[keyByName];

  if (names.length) return resultMap[names[names.length - 1]];

  const firstKey = Object.keys(resultMap)[0];
  return resultMap[firstKey];
}

// -------------------- compute clearance --------------------
function computeClearanceFromLaneLogits(laneTensor, origW, origH, vehicleCenterRatio, bandYOffsetRatio) {
  const dims = laneTensor.dims;
  if (!dims || dims.length !== 4) {
    throw new Error(`Unexpected lane tensor dims: ${JSON.stringify(dims)}`);
  }
  const [N, C, H, W] = dims;
  if (N !== 1) throw new Error("Expected batch=1");
  if (H <= 0 || W <= 0) throw new Error(`Invalid lane tensor size: ${H}x${W}`);

  const data = laneTensor.data;

  const mask = new Uint8Array(H * W);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idxHW = y * W + x;

      let bestC = 0;
      let bestV = -Infinity;

      for (let c = 0; c < C; c++) {
        const v = data[c * (H * W) + idxHW];
        if (v > bestV) {
          bestV = v;
          bestC = c;
        }
      }
      mask[idxHW] = bestC;
    }
  }

  const isLane = (idx) => mask[idx] === 1;

  const BASE_LOOKAHEAD_CENTER = 0.75;
  const LOOKAHEAD_HALF_HEIGHT = 0.08;

  const bandCenter = Math.min(0.9, Math.max(0.2, BASE_LOOKAHEAD_CENTER + bandYOffsetRatio));
  const rowStart = Math.floor(origH * (bandCenter - LOOKAHEAD_HALF_HEIGHT));
  const rowEnd   = Math.floor(origH * (bandCenter + LOOKAHEAD_HALF_HEIGHT));

  const vehicleX = Math.floor(origW * vehicleCenterRatio);

  const yStart = Math.max(0, Math.min(H - 1, Math.floor((rowStart / origH) * H)));
  const yEnd   = Math.max(0, Math.min(H - 1, Math.floor((rowEnd   / origH) * H)));

  const vehicleXModel = Math.floor((vehicleX / origW) * W);

  let minClearanceModel = Infinity;
  const stepY = 1;

  for (let y = yStart; y <= yEnd; y += stepY) {
    let foundAny = false;

    for (let x = 0; x < W; x++) {
      if (isLane(y * W + x)) {
        foundAny = true;
        const d = Math.abs(x - vehicleXModel);
        if (d < minClearanceModel) minClearanceModel = d;
      }
    }
    if (!foundAny) continue;
  }

  if (!Number.isFinite(minClearanceModel) || minClearanceModel === Infinity) {
    return {
      hasLane: false,
      clearancePx: null,
      onLine: false,
      vehicleX,
      bandCenter,
      rowStart,
      rowEnd
    };
  }

  const clearancePx = Math.round(minClearanceModel * (origW / W));

  const MIN_LINE_CLEARANCE_PX = 50;
  const onLine = clearancePx < MIN_LINE_CLEARANCE_PX;

  return {
    hasLane: true,
    clearancePx,
    onLine,
    vehicleX,
    bandCenter,
    rowStart,
    rowEnd
  };
}

// -------------------- ffmpeg frame sampler --------------------
async function sampleFramesRgb(videoPath, fps = 2) {
  const probe = await new Promise((resolve) => {
    const p = spawn("ffprobe", [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height",
      "-of", "json",
      videoPath
    ]);

    let out = "";
    p.stdout.on("data", d => (out += d.toString()));
    p.on("close", (code) => {
      try {
        if (code === 0) {
          const json = JSON.parse(out);
          const s = json.streams?.[0];
          resolve({ width: s?.width, height: s?.height });
        } else {
          resolve({ width: null, height: null });
        }
      } catch {
        resolve({ width: null, height: null });
      }
    });
  });

  const width = probe.width;
  const height = probe.height;

  if (!width || !height) {
    throw new Error("Could not determine video width/height (ffprobe missing or failed).");
  }

  const frameSize = width * height * 3;

  const ff = spawn("ffmpeg", [
    "-i", videoPath,
    "-vf", `fps=${fps}`,
    "-f", "rawvideo",
    "-pix_fmt", "rgb24",
    "pipe:1"
  ], { stdio: ["ignore", "pipe", "pipe"] });

  let stderr = "";
  ff.stderr.on("data", d => (stderr += d.toString()));

  const frames = [];
  let buffer = Buffer.alloc(0);

  for await (const chunk of ff.stdout) {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length >= frameSize) {
      frames.push(buffer.subarray(0, frameSize));
      buffer = buffer.subarray(frameSize);

      if (frames.length >= 60) break;
    }

    if (frames.length >= 60) break;
  }

  try { ff.kill("SIGKILL"); } catch {}

  if (!frames.length) {
    logger.error(stderr);
    throw new Error("No frames decoded from video.");
  }

  return { frames, width, height };
}

// -------------------- Helpers: group onLine frames into segments --------------------
function groupConsecutiveFrames(frames, sampleFps, maxGapFrames = 1) {
  // frames: [{ frameIdx, timestampSec, clearancePx }]
  // maxGapFrames=1 means consecutive sampled frames only (gap <= 1)
  if (!frames.length) return [];

  const sorted = [...frames].sort((a, b) => a.frameIdx - b.frameIdx);
  const segments = [];

  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const gap = cur.frameIdx - prev.frameIdx;

    if (gap <= maxGapFrames) {
      prev = cur;
      continue;
    }

    // close segment
    segments.push({
      startFrame: start.frameIdx,
      endFrame: prev.frameIdx,
      startTime: Number((start.timestampSec).toFixed(2)),
      endTime: Number((prev.timestampSec).toFixed(2)),
      duration: Number(((prev.timestampSec - start.timestampSec) + (1 / sampleFps)).toFixed(2)),
      worstClearancePx: Math.min(...sorted
        .filter(f => f.frameIdx >= start.frameIdx && f.frameIdx <= prev.frameIdx)
        .map(f => f.clearancePx ?? Infinity)),
    });

    start = cur;
    prev = cur;
  }

  // last segment
  segments.push({
    startFrame: start.frameIdx,
    endFrame: prev.frameIdx,
    startTime: Number((start.timestampSec).toFixed(2)),
    endTime: Number((prev.timestampSec).toFixed(2)),
    duration: Number(((prev.timestampSec - start.timestampSec) + (1 / sampleFps)).toFixed(2)),
    worstClearancePx: Math.min(...sorted
      .filter(f => f.frameIdx >= start.frameIdx && f.frameIdx <= prev.frameIdx)
      .map(f => f.clearancePx ?? Infinity)),
  });

  return segments;
}

// -------------------- Build analysis --------------------
function buildLaneAnalysis({ analysisId, originalName, storedFilename, score, grade, summary, events, breakdown, debug }) {
  const videoUrl = `/uploads/${storedFilename}`;
  return {
    id: analysisId,
    videoName: originalName,
    videoDuration: 0,
    videoUrl,
    createdAt: nowIso(),
    score,
    grade,
    summary,
    events,
    breakdown,
    debug // <--- include extra info for frontend/dev
  };
}

// Health check
router.get("/health", (_req, res) => {
  res.json({ ok: true, time: nowIso() });
});

/**
 * POST /api/analyze
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

    res.status(202).json({ jobId });

    const videoPath = path.resolve(env.UPLOAD_DIR, req.file.filename);

    (async () => {
      try {
        const SAMPLE_FPS = 2; // <--- IMPORTANT: used for timestamps (matches sampleFramesRgb call)

        updateJob(jobId, { status: "processing", progress: 10, message: "Loading model…" });

        const session = await getOnnxSession();
        const inputName = session.inputNames[0];

        const meta = session.inputMetadata?.[inputName];
        const dims = meta?.dimensions;
        const dstH = Array.isArray(dims) && dims.length >= 4 ? Number(dims[2]) : 640;
        const dstW = Array.isArray(dims) && dims.length >= 4 ? Number(dims[3]) : 640;

        const vehicleCenterRatio = 0.50;
        const bandYOffsetRatio = 0.0;

        updateJob(jobId, { status: "processing", progress: 25, message: "Decoding frames…" });
        const { frames, width, height } = await sampleFramesRgb(videoPath, SAMPLE_FPS);

        updateJob(jobId, { status: "processing", progress: 55, message: "Running lane inference…" });

        let badCount = 0;
        let goodCount = 0;
        let noLaneCount = 0;

        let worstClearance = Infinity;
        let worstAtFrame = 0;

        // ✅ NEW: remember *all* on-line frames (with timestamps)
        const onLineFrames = []; // { frameIdx, timestampSec, clearancePx }

        for (let i = 0; i < frames.length; i++) {
          const rgb = frames[i];

          const inputTensor = await preprocessToNCHWFloat32(rgb, width, height, dstW, dstH);
          const results = await session.run({ [inputName]: inputTensor });

          const laneTensor = pickLaneTensor(results, session);

          const info = computeClearanceFromLaneLogits(
            laneTensor,
            width,
            height,
            vehicleCenterRatio,
            bandYOffsetRatio
          );

          const timestampSec = i / SAMPLE_FPS;

          if (!info.hasLane) {
            noLaneCount++;
            continue;
          }

          if (info.clearancePx < worstClearance) {
            worstClearance = info.clearancePx;
            worstAtFrame = i;
          }

          if (info.onLine) {
            badCount++;
            onLineFrames.push({
              frameIdx: i,
              timestampSec,
              clearancePx: info.clearancePx
            });
          } else {
            goodCount++;
          }
        }

        updateJob(jobId, { status: "processing", progress: 80, message: "Scoring & generating report…" });

        const totalLaneFrames = badCount + goodCount;
        const badRatio = totalLaneFrames ? badCount / totalLaneFrames : 1;

        let score = 100;
        if (totalLaneFrames === 0) score = 50;
        else score = Math.max(0, Math.round(100 - badRatio * 60 - (noLaneCount / frames.length) * 30));

        let grade = "C";
        if (score >= 90) grade = "A";
        else if (score >= 80) grade = "B";
        else if (score >= 70) grade = "C";
        else if (score >= 60) grade = "D";
        else grade = "F";

        // ✅ NEW: Convert onLine frames into segments for nicer frontend markers
        const onLineSegments = groupConsecutiveFrames(onLineFrames, SAMPLE_FPS, 1);

        // ✅ Events: create one event per segment (better than one per frame)
        const events = [];

        for (let s = 0; s < onLineSegments.length; s++) {
          const seg = onLineSegments[s];

          events.push({
            id: `evt_lane_${s + 1}`,
            type: "lane_discipline",
            timestamp: Math.floor(seg.startTime), // frontend can seek to this
            duration: Math.max(1, Math.ceil(seg.duration)),
            severity: "high",
            points: -Math.max(1, Math.round(badRatio * 12)),
            description: `Lane line contact/veer. Worst clearance ≈ ${seg.worstClearancePx}px`
          });
        }

        // Keep your “worst” callout if you want a primary headline
        const worstTs = Math.round(worstAtFrame / SAMPLE_FPS);

        const summary =
          totalLaneFrames === 0
            ? "Lane lines were not detected reliably in the sampled frames."
            : `Lane guidance analysis complete. On-line frames: ${badCount}/${totalLaneFrames}. Worst at ~${worstTs}s.`;

        const breakdown = {
          lane_discipline: {
            score: totalLaneFrames === 0 ? 50 : Math.max(0, Math.round(100 - badRatio * 80)),
            maxScore: 100,
            deductions: [
              ...(badCount > 0 ? [{ reason: `On-line detections (${badCount})`, points: -Math.round(badRatio * 20) }] : []),
              ...(noLaneCount > 0 ? [{ reason: `No-lane frames (${noLaneCount})`, points: -Math.round((noLaneCount / frames.length) * 20) }] : [])
            ],
            tips: [
              "Keep the vehicle centered in the lane",
              "Avoid drifting during turns and lane changes",
              "Check camera angle/visibility if lanes are not detected"
            ]
          }
        };

        // ✅ NEW: Debug payload for frontend (optional but super useful)
        const debug = {
          sampleFps: SAMPLE_FPS,
          modelInput: { dstW, dstH },
          onLineFrameCount: onLineFrames.length,
          onLineFrames: onLineFrames.map(f => ({
            frameIdx: f.frameIdx,
            timestampSec: Number(f.timestampSec.toFixed(2)),
            clearancePx: f.clearancePx
          })),
          onLineTimestamps: onLineFrames.map(f => Number(f.timestampSec.toFixed(2))),
          onLineSegments
        };

        const analysis = buildLaneAnalysis({
          analysisId,
          originalName: req.file.originalname,
          storedFilename: req.file.filename,
          score,
          grade,
          summary,
          events,
          breakdown,
          debug
        });

        setAnalysis(analysis);

        updateJob(jobId, {
          status: "complete",
          progress: 100,
          message: "Complete",
          resultId: analysisId
        });
      } catch (e) {
        logger.error("Processing failed", e);
        updateJob(jobId, { status: "error", message: "Processing failed" });
      }
    })();
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
