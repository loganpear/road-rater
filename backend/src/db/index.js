import fs from "node:fs";
import path from "node:path";

import { logger } from "../config/logger.js";

// ---- Pure JS "DB" (no native bindings) ----
// Persists to storage/app.json so you keep history between restarts.

const STORAGE_DIR = "storage";
const DATA_PATH = path.join(STORAGE_DIR, "app.json");

/** @type {Map<string, any>} */
const jobs = new Map();
/** @type {Map<string, any>} */
const analyses = new Map();

function nowIso() {
  return new Date().toISOString();
}

function loadFromDisk() {
  try {
    if (!fs.existsSync(DATA_PATH)) return;
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw);

    if (parsed?.jobs) for (const j of parsed.jobs) jobs.set(j.id, j);
    if (parsed?.analyses) for (const a of parsed.analyses) analyses.set(a.id, a);
  } catch (e) {
    logger.warn("Failed to load storage/app.json; starting fresh", e);
  }
}

let saveTimer;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
      const payload = {
        savedAt: nowIso(),
        jobs: Array.from(jobs.values()),
        analyses: Array.from(analyses.values())
      };
      fs.writeFileSync(DATA_PATH, JSON.stringify(payload, null, 2), "utf-8");
    } catch (e) {
      logger.warn("Failed to persist storage/app.json", e);
    }
  }, 250);
}

export async function initDb() {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  loadFromDisk();
  logger.info("In-memory DB initialized (persisting to storage/app.json)");
}

// ---- Job API ----
export function createJob({ jobId, analysisId, originalName, storedFilename }) {
  const job = {
    id: jobId,
    status: "queued",
    progress: 0,
    message: "Queued…",
    resultId: analysisId,
    originalFilename: originalName,
    storedPath: storedFilename,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  jobs.set(jobId, job);
  scheduleSave();
  return job;
}

export function updateJob(jobId, patch) {
  const prev = jobs.get(jobId);
  if (!prev) return null;
  const next = { ...prev, ...patch, updatedAt: nowIso() };
  jobs.set(jobId, next);
  scheduleSave();
  return next;
}

export function getJob(jobId) {
  return jobs.get(jobId) ?? null;
}

// ---- Analysis API ----
export function setAnalysis(analysis) {
  analyses.set(analysis.id, analysis);
  scheduleSave();
  return analysis;
}

export function getAnalysis(analysisId) {
  return analyses.get(analysisId) ?? null;
}

export function listAnalyses(limit = 25) {
  return Array.from(analyses.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export { nowIso };
