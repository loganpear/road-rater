import { logger } from "../config/logger.js";

export function errorHandler(err, req, res, next) {
  logger.error("Request failed", { reqId: req.id, err });

  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.code || "server_error",
    message: err.message || "Something went wrong",
    reqId: req.id
  });
}
