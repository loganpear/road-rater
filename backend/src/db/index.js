import fs from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

sqlite3.verbose();

let db;

export function getDb() {
  if (!db) throw new Error("DB not initialized");
  return db;
}

export async function initDb() {
  fs.mkdirSync(path.dirname(env.DB_PATH), { recursive: true });

  db = new sqlite3.Database(env.DB_PATH);

  const schemaPath = new URL("./schema.sql", import.meta.url);
  const schema = fs.readFileSync(schemaPath, "utf-8");

  await exec(schema);
  logger.info("DB initialized:", env.DB_PATH);
}

export function exec(sql) {
  return new Promise((resolve, reject) => {
    getDb().exec(sql, (err) => (err ? reject(err) : resolve()));
  });
}

export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}
