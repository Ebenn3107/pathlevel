import type { RequestHandler } from "express";
import { getXpSummary } from "../services/xpService";

/** GET /api/xp */
export const getXpSummaryHandler: RequestHandler = async (_req, res, next) => {
  try {
    // TODO: extract userId from authenticated request
    const summary = await getXpSummary("placeholder-user-id");
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};
