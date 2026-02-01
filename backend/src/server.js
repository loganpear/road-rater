import { createServer } from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { initDb } from "./db/index.js";

// Only initialize DB and start server if running as a standalone process
if (import.meta.url.startsWith('file://') && process.argv[1] === new URL(import.meta.url).pathname) {
  (async () => {
    await initDb();
    const server = createServer(app);
    server.listen(env.PORT, () => {
      logger.info(`API listening on http://localhost:${env.PORT}`);
    });
  })();
}

export default app;
