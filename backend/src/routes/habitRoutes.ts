import { Router } from "express";
import {
  listHabits,
  createHabitHandler,
  updateHabitHandler,
  completeHabitHandler,
  deleteHabitHandler,
} from "../controllers/habitController";

const router = Router();

router.get("/", listHabits);
router.post("/", createHabitHandler);
router.patch("/:id", updateHabitHandler);
router.post("/:id/complete", completeHabitHandler);
router.delete("/:id", deleteHabitHandler);

export default router;
