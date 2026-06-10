import type { RequestHandler } from "express";
import { getAllAchievements, getUserAchievements, evaluateAchievements } from "../services/achievementService";
import { getUserId } from "../middlewares/auth";

/** GET /api/achievements */
export const listAchievements: RequestHandler = async (_req, res, next) => {
  try {
    const achievements = await getAllAchievements();
    res.json({ success: true, data: achievements });
  } catch (err) {
    next(err);
  }
};

/** GET /api/achievements/me */
export const listMyAchievements: RequestHandler = async (req, res, next) => {
  try {
    const achievements = await getUserAchievements(getUserId(req));
    res.json({ success: true, data: achievements });
  } catch (err) {
    next(err);
  }
};
