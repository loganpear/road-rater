PRAGMA journal_mode = WAL;

-- For future use, to associate videos with users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- To store metadata about each uploaded video
CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  upload_timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- To store individual frames extracted from videos
CREATE TABLE IF NOT EXISTS frames (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL,
  frame_number INTEGER NOT NULL,
  filepath TEXT NOT NULL,
  timestamp_in_video REAL NOT NULL,
  FOREIGN KEY (video_id) REFERENCES videos (id)
);

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

-- Insert a default user for now
INSERT OR IGNORE INTO users (id, username) VALUES (1, 'default_user');