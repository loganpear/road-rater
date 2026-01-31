import dotenv from "dotenv";

dotenv.config();

function required(name, fallback) {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const env = {
  PORT: Number(required("PORT", "4000")),
  NODE_ENV: required("NODE_ENV", "development"),
  // Vite dev server in this repo runs on :8080
  CORS_ORIGIN: required("CORS_ORIGIN", "http://localhost:8080"),
  UPLOAD_DIR: required("UPLOAD_DIR", "uploads"),
  MAX_UPLOAD_MB: Number(required("MAX_UPLOAD_MB", "500")),
  DB_PATH: required("DB_PATH", "storage/app.db"),
  RATE_LIMIT_WINDOW_MS: Number(required("RATE_LIMIT_WINDOW_MS", "60000")),
  RATE_LIMIT_MAX: Number(required("RATE_LIMIT_MAX", "120"))
};
