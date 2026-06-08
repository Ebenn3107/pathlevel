import type { RequestHandler } from "express";
import { getXpSummary } from "../services/xpService";
import { getUserId } from "../middlewares/auth";

/** GET /api/xp */
export const getXpSummaryHandler: RequestHandler = async (req, res, next) => {
  try {
    const summary = await getXpSummary(getUserId(req));
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};
