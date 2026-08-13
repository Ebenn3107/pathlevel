import type { RequestHandler } from "express";
import {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  archiveGoal,
  restoreGoal,
  getGoalUnits,
  createGoalUnit,
  getGoalResources,
  linkResourceToGoal,
  unlinkResourceFromGoal,
} from "../services/learningGoalService";
import { getUserId } from "../middlewares/auth";

/** GET /api/learning/goals */
export const listGoals: RequestHandler = async (req, res, next) => {
  try {
    const goals = await getGoals(getUserId(req));
    res.json({ success: true, data: goals });
  } catch (err) {
    next(err);
  }
};

/** POST /api/learning/goals */
export const createGoalHandler: RequestHandler = async (req, res, next) => {
  try {
    const goal = await createGoal(getUserId(req), req.body);
    res.status(201).json({ success: true, data: goal });
  } catch (err) {
    next(err);
  }
};

/** GET /api/learning/goals/:id */
export const getGoalHandler: RequestHandler = async (req, res, next) => {
  try {
    const goal = await getGoal(req.params.id as string, getUserId(req));
    res.json({ success: true, data: goal });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/learning/goals/:id */
export const updateGoalHandler: RequestHandler = async (req, res, next) => {
  try {
    const goal = await updateGoal(req.params.id as string, getUserId(req), req.body);
    res.json({ success: true, data: goal });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/learning/goals/:id */
export const deleteGoalHandler: RequestHandler = async (req, res, next) => {
  try {
    await deleteGoal(req.params.id as string, getUserId(req));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/** POST /api/learning/goals/:id/archive */
export const archiveGoalHandler: RequestHandler = async (req, res, next) => {
  try {
    const goal = await archiveGoal(req.params.id as string, getUserId(req));
    res.json({ success: true, data: goal });
  } catch (err) {
    next(err);
  }
};

/** POST /api/learning/goals/:id/restore */
export const restoreGoalHandler: RequestHandler = async (req, res, next) => {
  try {
    const goal = await restoreGoal(req.params.id as string, getUserId(req));
    res.json({ success: true, data: goal });
  } catch (err) {
    next(err);
  }
};

/* ── Units under a goal ───────────────────────────────────────── */

/** GET /api/learning/goals/:id/units */
export const listGoalUnits: RequestHandler = async (req, res, next) => {
  try {
    const units = await getGoalUnits(req.params.id as string, getUserId(req));
    res.json({ success: true, data: units });
  } catch (err) {
    next(err);
  }
};

/** POST /api/learning/goals/:id/units */
export const createGoalUnitHandler: RequestHandler = async (req, res, next) => {
  try {
    const unit = await createGoalUnit(req.params.id as string, getUserId(req), req.body);
    res.status(201).json({ success: true, data: unit });
  } catch (err) {
    next(err);
  }
};

/* ── Goal-level / Unassigned Resources ────────────────────────── */

/** GET /api/learning/goals/:id/resources */
export const listGoalResources: RequestHandler = async (req, res, next) => {
  try {
    const resources = await getGoalResources(req.params.id as string, getUserId(req));
    res.json({ success: true, data: resources });
  } catch (err) {
    next(err);
  }
};

/** POST /api/learning/goals/:id/resources  (body: { resourceId }) */
export const linkResourceToGoalHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    await linkResourceToGoal(req.params.id as string, req.body.resourceId as string, userId);
    res.status(201).json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/learning/goals/:id/resources/:resourceId */
export const unlinkResourceFromGoalHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    await unlinkResourceFromGoal(
      req.params.id as string,
      req.params.resourceId as string,
      userId,
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
