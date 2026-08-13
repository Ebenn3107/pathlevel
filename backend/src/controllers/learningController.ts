import type { RequestHandler } from "express";
import {
  getSessions,
  getUnitSessions,
  createSession,
  updateSession,
  deleteSession,
  getSessionResources,
  linkResourceToSession,
  unlinkResourceFromSession,
  getSessionSummary,
  upsertSessionSummary,
  deleteSessionSummary,
} from "../services/learningService";
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
    // XP award + achievement evaluation happen atomically inside updateSession
    const result = await updateSession(req.params.id as string, userId, req.body);

    const response: Record<string, unknown> = { success: true, data: result.session };
    if (result.newAchievements && result.newAchievements.length > 0) {
      response.newAchievements = result.newAchievements;
    }
    res.json(response);
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

/** GET /api/learning/units/:unitId/sessions */
export const listUnitSessions: RequestHandler = async (req, res, next) => {
  try {
    const sessions = await getUnitSessions(req.params.unitId as string, getUserId(req));
    res.json({ success: true, data: sessions });
  } catch (err) {
    next(err);
  }
};

/* ── Session Resources ────────────────────────────────────────── */

/** GET /api/learning/:id/resources */
export const listSessionResources: RequestHandler = async (req, res, next) => {
  try {
    const resources = await getSessionResources(req.params.id as string, getUserId(req));
    res.json({ success: true, data: resources });
  } catch (err) {
    next(err);
  }
};

/** POST /api/learning/:id/resources  (body: { resourceId }) */
export const linkResourceToSessionHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    await linkResourceToSession(req.params.id as string, req.body.resourceId as string, userId);
    res.status(201).json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/learning/:id/resources/:resourceId */
export const unlinkResourceFromSessionHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    await unlinkResourceFromSession(
      req.params.id as string,
      req.params.resourceId as string,
      userId,
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/* ── Summaries ────────────────────────────────────────────────── */

/** GET /api/learning/:id/summary */
export const getSessionSummaryHandler: RequestHandler = async (req, res, next) => {
  try {
    const summary = await getSessionSummary(req.params.id as string, getUserId(req));
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};

/** POST /api/learning/:id/summary  (body: { content }) — create or replace */
export const upsertSessionSummaryHandler: RequestHandler = async (req, res, next) => {
  try {
    const summary = await upsertSessionSummary(
      req.params.id as string,
      getUserId(req),
      req.body.content as string,
    );
    res.status(201).json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/learning/:id/summary — remove the summary (skip) */
export const deleteSessionSummaryHandler: RequestHandler = async (req, res, next) => {
  try {
    await deleteSessionSummary(req.params.id as string, getUserId(req));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
