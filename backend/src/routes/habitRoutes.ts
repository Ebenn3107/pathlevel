import { Router } from "express";
import {
  listHabits,
  createHabitHandler,
  updateHabitHandler,
  completeHabitHandler,
  deleteHabitHandler,
} from "../controllers/habitController";
import { validate } from "../middlewares/validate";
import { createHabitSchema, updateHabitSchema } from "../validators/habits";

const router = Router();

router.get("/", listHabits);
router.post("/", validate(createHabitSchema), createHabitHandler);
router.patch("/:id", validate(updateHabitSchema), updateHabitHandler);
router.post("/:id/complete", completeHabitHandler);
router.delete("/:id", deleteHabitHandler);

export default router;
