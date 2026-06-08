import { Router } from "express";
import {
  listResources,
  createResourceHandler,
  updateResourceHandler,
  deleteResourceHandler,
} from "../controllers/resourceController";
import { validate } from "../middlewares/validate";
import { createResourceSchema, updateResourceSchema } from "../validators/resources";

const router = Router();

router.get("/", listResources);
router.post("/", validate(createResourceSchema), createResourceHandler);
router.patch("/:id", validate(updateResourceSchema), updateResourceHandler);
router.delete("/:id", deleteResourceHandler);

export default router;
