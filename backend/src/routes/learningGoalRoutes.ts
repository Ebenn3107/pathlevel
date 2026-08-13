import { Router } from "express";
import {
  listGoals,
  createGoalHandler,
  getGoalHandler,
  updateGoalHandler,
  deleteGoalHandler,
  archiveGoalHandler,
  restoreGoalHandler,
  listGoalUnits,
  createGoalUnitHandler,
  listGoalResources,
  linkResourceToGoalHandler,
  unlinkResourceFromGoalHandler,
} from "../controllers/learningGoalController";
import { validate } from "../middlewares/validate";
import {
  createGoalSchema,
  updateGoalSchema,
  createUnitSchema,
  linkResourceSchema,
} from "../validators/learningGoals";

const router = Router();

router.get("/", listGoals);
router.post("/", validate(createGoalSchema), createGoalHandler);
router.get("/:id", getGoalHandler);
router.patch("/:id", validate(updateGoalSchema), updateGoalHandler);
router.delete("/:id", deleteGoalHandler);
router.post("/:id/archive", archiveGoalHandler);
router.post("/:id/restore", restoreGoalHandler);

// Units under a goal
router.get("/:id/units", listGoalUnits);
router.post("/:id/units", validate(createUnitSchema), createGoalUnitHandler);

// Goal-level / unassigned Resources
router.get("/:id/resources", listGoalResources);
router.post("/:id/resources", validate(linkResourceSchema), linkResourceToGoalHandler);
router.delete("/:id/resources/:resourceId", unlinkResourceFromGoalHandler);

export default router;
