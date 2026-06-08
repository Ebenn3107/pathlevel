import type { RequestHandler } from "express";
import { getHealth } from "../services/healthService";

/** GET /api/health */
export const checkHealth: RequestHandler = async (_req, res, next) => {
  try {
    const health = await getHealth();
    res.json({ success: true, data: health });
  } catch (err) {
    next(err);
  }
};
