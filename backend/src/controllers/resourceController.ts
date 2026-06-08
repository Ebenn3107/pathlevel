import type { RequestHandler } from "express";
import { getResources, createResource, updateResource, deleteResource } from "../services/resourceService";

const USER_ID = "placeholder-user-id"; // TODO: extract from authenticated request

/** GET /api/resources */
export const listResources: RequestHandler = async (_req, res, next) => {
  try {
    const resources = await getResources(USER_ID);
    res.json({ success: true, data: resources });
  } catch (err) {
    next(err);
  }
};

/** POST /api/resources */
export const createResourceHandler: RequestHandler = async (req, res, next) => {
  try {
    const resource = await createResource(USER_ID, req.body);
    res.status(201).json({ success: true, data: resource });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/resources/:id */
export const updateResourceHandler: RequestHandler = async (req, res, next) => {
  try {
    const resource = await updateResource(req.params.id as string, USER_ID, req.body);
    res.json({ success: true, data: resource });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/resources/:id */
export const deleteResourceHandler: RequestHandler = async (req, res, next) => {
  try {
    await deleteResource(req.params.id as string, USER_ID);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
