import { Router } from "express";
import {
  getUnitHandler,
  updateUnitHandler,
  deleteUnitHandler,
  listUnitResources,
  linkResourceToUnitHandler,
  unlinkResourceFromUnitHandler,
} from "../controllers/learningUnitController";
import { validate } from "../middlewares/validate";
import { updateUnitSchema, linkResourceSchema } from "../validators/learningGoals";

const router = Router();

router.get("/:id", getUnitHandler);
router.patch("/:id", validate(updateUnitSchema), updateUnitHandler);
router.delete("/:id", deleteUnitHandler);

// Unit Resources
router.get("/:id/resources", listUnitResources);
router.post("/:id/resources", validate(linkResourceSchema), linkResourceToUnitHandler);
router.delete("/:id/resources/:resourceId", unlinkResourceFromUnitHandler);

export default router;
