import { Router } from "express";
import {
  listTasks,
  createTaskHandler,
  updateTaskHandler,
  deleteTaskHandler,
} from "../controllers/taskController";

const router = Router();

router.get("/", listTasks);
router.post("/", createTaskHandler);
router.patch("/:id", updateTaskHandler);
router.delete("/:id", deleteTaskHandler);

export default router;
