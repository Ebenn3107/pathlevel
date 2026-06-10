import type { ErrorMiddleware } from "../types";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

/**
 * Map known Prisma client errors to user-friendly messages.
 * Internal implementation details are never leaked to the client.
 */
function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  message: string;
} {
  switch (err.code) {
    case "P2002": {
      // Unique constraint violation
      const target = (err.meta?.target as string[]) ?? [];

      if (target.some((f: string) => f.includes("email"))) {
        return { statusCode: 409, message: "Email already exists" };
      }
      if (target.some((f: string) => f.includes("username"))) {
        return { statusCode: 409, message: "Username already exists" };
      }
      return { statusCode: 409, message: "Resource already exists" };
    }

    case "P2025": {
      // Record not found
      return { statusCode: 404, message: "Resource not found" };
    }

    default:
      return { statusCode: 500, message: "Something went wrong" };
  }
}

/**
 * Global error-handling middleware.
 *
 * Catches all errors thrown from controllers/services and returns a
 * safe, standardized response. Internal details such as Prisma error
 * codes, file paths, and stack traces are never exposed to the client.
 */
export const errorHandler: ErrorMiddleware = (err, _req, res, _next) => {
  // Always log the full error server-side for debugging
  console.error("[ERROR]", err);

  /* ── Known application errors (NotFoundError, UnauthorizedError, etc.) ── */
  if (typeof err === "object" && err !== null && "statusCode" in err) {
    const statusCode = (err as { statusCode: number }).statusCode;

    // Only expose the message for client errors (4xx), not server errors (5xx)
    if (statusCode >= 400 && statusCode < 500) {
      res.status(statusCode).json({
        success: false,
        message: (err as Error).message,
      });
      return;
    }

    // 5xx application errors — never leak the real message
    res.status(statusCode).json({
      success: false,
      message: "Something went wrong",
    });
    return;
  }

  /* ── Prisma known request errors (P2002, P2025, etc.) ─────────────── */
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(err);
    res.status(mapped.statusCode).json({
      success: false,
      message: mapped.message,
    });
    return;
  }

  /* ── Prisma validation errors ─────────────────────────────────────── */
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: "Invalid data provided",
    });
    return;
  }

  /* ── Zod validation errors (if they escape the middleware) ────────── */
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
    });
    return;
  }

  /* ── Everything else — safe fallback ──────────────────────────────── */
  res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
};
