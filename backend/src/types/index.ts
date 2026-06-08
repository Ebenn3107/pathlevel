import { Request, Response, NextFunction } from "express";

/** Standard JSON envelope for all API responses. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Express middleware signature. */
export type Middleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

/** Express error-handling middleware signature. */
export type ErrorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;
