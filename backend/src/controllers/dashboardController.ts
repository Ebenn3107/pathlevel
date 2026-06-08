import type { RequestHandler } from "express";
import { getDashboard } from "../services/dashboardService";

/** GET /api/dashboard */
export const getDashboardSummary: RequestHandler = async (_req, res, next) => {
  try {
    // TODO: extract userId from authenticated request
    const summary = await getDashboard("placeholder-user-id");
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};
