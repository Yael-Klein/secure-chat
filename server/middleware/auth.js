import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { getSession } from "../utils/database.js";
import { logger } from "../utils/logger.js";

/**
 * Authentication middleware
 */
export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, error: "No token provided" });
    }

    // Verify JWT
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Check if session exists
    const session = await getSession(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "Invalid session" });
    }

    req.user = {
      id: decoded.userId,
      username: decoded.username,
    };
    req.token = token;

    next();
  } catch (error) {
    logger.warn(`Authentication failed: ${error.message}`);
    return res.status(403).json({ success: false, error: "Invalid or expired token" });
  }
}

