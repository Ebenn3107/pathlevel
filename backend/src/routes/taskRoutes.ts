import { Router } from "express";
import {
  listTasks,
  createTaskHandler,
  updateTaskHandler,
  deleteTaskHandler,
} from "../controllers/taskController";
import { validate } from "../middlewares/validate";
import { createTaskSchema, updateTaskSchema } from "../validators/tasks";

const router = Router();

router.get("/", listTasks);
router.post("/", validate(createTaskSchema), createTaskHandler);
router.patch("/:id", validate(updateTaskSchema), updateTaskHandler);
router.delete("/:id", deleteTaskHandler);

export default router;
