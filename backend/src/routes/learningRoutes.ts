import { Router } from "express";
import {
  listSessions,
  createSessionHandler,
  updateSessionHandler,
  deleteSessionHandler,
} from "../controllers/learningController";
import { validate } from "../middlewares/validate";
import { createSessionSchema, updateSessionSchema } from "../validators/learning";

const router = Router();

router.get("/", listSessions);
router.post("/", validate(createSessionSchema), createSessionHandler);
router.patch("/:id", validate(updateSessionSchema), updateSessionHandler);
router.delete("/:id", deleteSessionHandler);

export default router;
