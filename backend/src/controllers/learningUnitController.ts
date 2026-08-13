import type { RequestHandler } from "express";
import {
  getUnit,
  updateUnit,
  deleteUnit,
  getUnitResources,
  linkResourceToUnit,
  unlinkResourceFromUnit,
} from "../services/learningUnitService";
import { getUserId } from "../middlewares/auth";

/** GET /api/learning/units/:id */
export const getUnitHandler: RequestHandler = async (req, res, next) => {
  try {
    const unit = await getUnit(req.params.id as string, getUserId(req));
    res.json({ success: true, data: unit });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/learning/units/:id */
export const updateUnitHandler: RequestHandler = async (req, res, next) => {
  try {
    const unit = await updateUnit(req.params.id as string, getUserId(req), req.body);
    res.json({ success: true, data: unit });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/learning/units/:id */
export const deleteUnitHandler: RequestHandler = async (req, res, next) => {
  try {
    await deleteUnit(req.params.id as string, getUserId(req));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/* ── Unit Resources ───────────────────────────────────────────── */

/** GET /api/learning/units/:id/resources */
export const listUnitResources: RequestHandler = async (req, res, next) => {
  try {
    const resources = await getUnitResources(req.params.id as string, getUserId(req));
    res.json({ success: true, data: resources });
  } catch (err) {
    next(err);
  }
};

/** POST /api/learning/units/:id/resources  (body: { resourceId }) */
export const linkResourceToUnitHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    await linkResourceToUnit(req.params.id as string, req.body.resourceId as string, userId);
    res.status(201).json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/learning/units/:id/resources/:resourceId */
export const unlinkResourceFromUnitHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    await unlinkResourceFromUnit(
      req.params.id as string,
      req.params.resourceId as string,
      userId,
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
