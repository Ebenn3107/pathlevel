import { Router } from "express";
import {
  listSessions,
  createSessionHandler,
  updateSessionHandler,
  deleteSessionHandler,
  listUnitSessions,
  listSessionResources,
  linkResourceToSessionHandler,
  unlinkResourceFromSessionHandler,
  getSessionSummaryHandler,
  upsertSessionSummaryHandler,
  deleteSessionSummaryHandler,
} from "../controllers/learningController";
import { validate } from "../middlewares/validate";
import {
  createSessionSchema,
  updateSessionSchema,
  linkResourceSchema,
  createSummarySchema,
} from "../validators/learning";

const router = Router();

router.get("/", listSessions);
router.get("/units/:unitId/sessions", listUnitSessions);
router.post("/", validate(createSessionSchema), createSessionHandler);
router.patch("/:id", validate(updateSessionSchema), updateSessionHandler);
router.delete("/:id", deleteSessionHandler);

// Session resources (M:N)
router.get("/:id/resources", listSessionResources);
router.post("/:id/resources", validate(linkResourceSchema), linkResourceToSessionHandler);
router.delete("/:id/resources/:resourceId", unlinkResourceFromSessionHandler);

// Session summaries
router.get("/:id/summary", getSessionSummaryHandler);
router.post("/:id/summary", validate(createSummarySchema), upsertSessionSummaryHandler);
router.delete("/:id/summary", deleteSessionSummaryHandler);

export default router;
