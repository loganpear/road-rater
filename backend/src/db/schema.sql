PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS video_jobs (
  id TEXT PRIMARY KEY,
  original_filename TEXT NOT NULL,
  stored_path TEXT NOT NULL,
  status TEXT NOT NULL,              -- queued | processing | done | failed
  score REAL,                        -- 0..100
  verdict TEXT,                      -- safe | unsafe | unknown
  details_json TEXT,                 -- JSON string
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
