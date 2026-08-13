import type { RequestHandler } from "express";
import {
  getResources,
  createResource,
  updateResource,
  deleteResource,
  archiveResource,
  restoreResource,
  getResourceLearningLinks,
  type ResourceListFilters,
} from "../services/resourceService";
import { getUserId } from "../middlewares/auth";
import { ValidationError } from "../types/error";
import { resourceLibraryStatuses, resourceProgresses } from "../validators/resources";

/**
 * Parse and validate optional list filters from the query string.
 * Invalid enum values are rejected with a 400 (never silently coerced),
 * consistent with the existing validation behavior.
 */
function parseListFilters(query: Record<string, unknown>): ResourceListFilters {
  const filters: ResourceListFilters = {};

  if (query.libraryStatus !== undefined) {
    if (!resourceLibraryStatuses.includes(query.libraryStatus as (typeof resourceLibraryStatuses)[number])) {
      throw new ValidationError("Invalid libraryStatus filter");
    }
    filters.libraryStatus = query.libraryStatus as ResourceListFilters["libraryStatus"];
  }

  if (query.progress !== undefined) {
    if (!resourceProgresses.includes(query.progress as (typeof resourceProgresses)[number])) {
      throw new ValidationError("Invalid progress filter");
    }
    filters.progress = query.progress as ResourceListFilters["progress"];
  }

  return filters;
}

/** GET /api/resources */
export const listResources: RequestHandler = async (req, res, next) => {
  try {
    const filters = parseListFilters(req.query);
    const resources = await getResources(getUserId(req), filters);
    res.json({ success: true, data: resources });
  } catch (err) {
    next(err);
  }
};

/** POST /api/resources */
export const createResourceHandler: RequestHandler = async (req, res, next) => {
  try {
    const resource = await createResource(getUserId(req), req.body);
    res.status(201).json({ success: true, data: resource });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/resources/:id */
export const updateResourceHandler: RequestHandler = async (req, res, next) => {
  try {
    const resource = await updateResource(req.params.id as string, getUserId(req), req.body);
    res.json({ success: true, data: resource });
  } catch (err) {
    next(err);
  }
};

/** POST /api/resources/:id/archive */
export const archiveResourceHandler: RequestHandler = async (req, res, next) => {
  try {
    const resource = await archiveResource(req.params.id as string, getUserId(req));
    res.json({ success: true, data: resource });
  } catch (err) {
    next(err);
  }
};

/** POST /api/resources/:id/restore */
export const restoreResourceHandler: RequestHandler = async (req, res, next) => {
  try {
    const resource = await restoreResource(req.params.id as string, getUserId(req));
    res.json({ success: true, data: resource });
  } catch (err) {
    next(err);
  }
};

/** GET /api/resources/:id/learning-links */
export const getResourceLearningLinksHandler: RequestHandler = async (req, res, next) => {
  try {
    const links = await getResourceLearningLinks(req.params.id as string, getUserId(req));
    res.json({ success: true, data: links });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/resources/:id */
export const deleteResourceHandler: RequestHandler = async (req, res, next) => {
  try {
    await deleteResource(req.params.id as string, getUserId(req));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
