import type { Request, Response, NextFunction } from "express";
import type { Role } from "@prisma/client";
import { verifyToken, type JWTPayload } from "../lib/jwt";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/* Middleware to verify JWT token from cookie
 Attaches user payload to request if valid
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = payload;
  next();
}

/**
 * Middleware factory to restrict access by role
 * Must be used after authenticate middleware
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}

/**
 * Shorthand middleware for admin-only routes
 */
export const requireAdmin = requireRole("ADMIN");

/**
 * Shorthand middleware for admin and manager routes
 */
export const requireManager = requireRole("ADMIN", "MANAGER");

