import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

/**
 * Middleware factory that validates the request body against a Zod schema.
 * Returns 400 with consistent error shape on failure.
 */
export function validate(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      _res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
