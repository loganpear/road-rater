import { makeId } from "../utils/id.js";

export function requestId(req, res, next) {
  req.id = req.headers["x-request-id"] || makeId("req");
  res.setHeader("x-request-id", req.id);
  next();
}
