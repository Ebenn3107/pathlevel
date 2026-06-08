import type { RequestHandler } from "express";
import { getDashboard } from "../services/dashboardService";
import { getUserId } from "../middlewares/auth";

/** GET /api/dashboard */
export const getDashboardSummary: RequestHandler = async (req, res, next) => {
  try {
    const summary = await getDashboard(getUserId(req));
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};
