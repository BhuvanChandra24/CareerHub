import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return next();
  try {
    req.user = jwt.verify(token, config.jwtSecret);
  } catch {
    // Public job browsing and applications by guest users remain supported.
  }
  next();
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token)
    return res.status(401).json({ message: "Please sign in to continue." });
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    return res
      .status(401)
      .json({ message: "Your session has expired. Please sign in again." });
  }
}
