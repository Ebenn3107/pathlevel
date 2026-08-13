import type { RequestHandler } from "express";
import { searchResources, normalizeSearchTerm } from "../services/searchService";
import { getUserId } from "../middlewares/auth";
import { ValidationError } from "../types/error";
import { searchQuerySchema } from "../validators/search";

/** GET /api/search?q=... — Resource-first search for the authenticated user. */
export const searchResourcesHandler: RequestHandler = async (req, res, next) => {
  try {
    const parsed = searchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid search query");
    }

    const query = normalizeSearchTerm(parsed.data.q);
    const results = await searchResources(getUserId(req), query);
    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};
