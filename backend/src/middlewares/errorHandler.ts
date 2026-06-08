import type { ErrorMiddleware } from "../types";

/** Global error-handling middleware. */
export const errorHandler: ErrorMiddleware = (err, _req, res, _next) => {
  const statusCode = "statusCode" in err ? (err as any).statusCode : 500;

  console.error(`[ERROR] ${err.message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
};
