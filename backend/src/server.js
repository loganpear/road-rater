import { createServer } from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { initDb } from "./db/index.js";

await initDb();

const server = createServer(app);

server.listen(env.PORT, () => {
  logger.info(`API listening on http://localhost:${env.PORT}`);
});
