import type { RequestHandler } from "express";
import { getSessions, createSession, updateSession, deleteSession } from "../services/learningService";
import { recordXp, XP_VALUES } from "../services/xpService";
import { getUserId } from "../middlewares/auth";

/** GET /api/learning */
export const listSessions: RequestHandler = async (req, res, next) => {
  try {
    const sessions = await getSessions(getUserId(req));
    res.json({ success: true, data: sessions });
  } catch (err) {
    next(err);
  }
};

/** POST /api/learning */
export const createSessionHandler: RequestHandler = async (req, res, next) => {
  try {
    const session = await createSession(getUserId(req), req.body);
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/learning/:id */
export const updateSessionHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const session = await updateSession(req.params.id as string, userId, req.body);

    if (req.body.endedAt) {
      await recordXp(userId, XP_VALUES.session_completed, "session_completed", session.id);
    }

    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/learning/:id */
export const deleteSessionHandler: RequestHandler = async (req, res, next) => {
  try {
    await deleteSession(req.params.id as string, getUserId(req));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
