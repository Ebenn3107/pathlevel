import { Router } from "express";
import {
  listHabits,
  createHabitHandler,
  updateHabitHandler,
  deleteHabitHandler,
} from "../controllers/habitController";

const router = Router();

router.get("/", listHabits);
router.post("/", createHabitHandler);
router.patch("/:id", updateHabitHandler);
router.delete("/:id", deleteHabitHandler);

export default router;
