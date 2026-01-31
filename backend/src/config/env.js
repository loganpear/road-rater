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
  CORS_ORIGIN: required("CORS_ORIGIN", "http://localhost:5173"),
  UPLOAD_DIR: required("UPLOAD_DIR", "uploads"),
  MAX_UPLOAD_MB: Number(required("MAX_UPLOAD_MB", "500")),
  DB_PATH: required("DB_PATH", "storage/app.db"),
  RATE_LIMIT_WINDOW_MS: Number(required("RATE_LIMIT_WINDOW_MS", "60000")),
  RATE_LIMIT_MAX: Number(required("RATE_LIMIT_MAX", "120"))
};
