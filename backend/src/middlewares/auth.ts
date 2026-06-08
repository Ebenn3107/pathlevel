import type { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { UnauthorizedError } from "../types/error";

/**
 * Middleware that verifies the JWT from the Authorization header
 * and attaches the userId to the request.
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError("No token provided");
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
};

/**
 * Helper to get the authenticated userId from a request.
 * Throws UnauthorizedError if the middleware wasn't applied.
 */
export function getUserId(req: Request): string {
  if (!req.userId) {
    throw new UnauthorizedError("Authentication required");
  }

  return req.userId;
}
