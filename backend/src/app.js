import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";

import { env } from "./config/env.js";
import { requestId } from "./middleware/requestId.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { router } from "./routes/index.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);

app.use(requestId);
app.use(rateLimit);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Serve uploaded videos so <video> can play them back
app.use(
  "/uploads",
  express.static(path.resolve(env.UPLOAD_DIR), {
    setHeaders(res) {
      res.setHeader("Accept-Ranges", "bytes");
    }
  })
);

app.use("/api", router);

app.use(notFound);
app.use(errorHandler);
