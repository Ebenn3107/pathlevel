import type { RequestHandler } from "express";
import { getSessions, createSession, updateSession, deleteSession } from "../services/learningService";
import { recordXp, XP_VALUES } from "../services/xpService";

const USER_ID = "placeholder-user-id"; // TODO: extract from authenticated request

/** GET /api/learning */
export const listSessions: RequestHandler = async (_req, res, next) => {
  try {
    const sessions = await getSessions(USER_ID);
    res.json({ success: true, data: sessions });
  } catch (err) {
    next(err);
  }
};

/** POST /api/learning */
export const createSessionHandler: RequestHandler = async (req, res, next) => {
  try {
    const session = await createSession(USER_ID, req.body);
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/learning/:id */
export const updateSessionHandler: RequestHandler = async (req, res, next) => {
  try {
    const session = await updateSession(req.params.id as string, USER_ID, req.body);

    // Award XP when a session is completed (idempotent via reference)
    if (req.body.endedAt) {
      await recordXp(USER_ID, XP_VALUES.session_completed, "session_completed", session.id).catch(() => {});
    }

    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/learning/:id */
export const deleteSessionHandler: RequestHandler = async (req, res, next) => {
  try {
    await deleteSession(req.params.id as string, USER_ID);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
