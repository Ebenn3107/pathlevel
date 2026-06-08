import { Router } from "express";
import {
  listSessions,
  createSessionHandler,
  updateSessionHandler,
  deleteSessionHandler,
} from "../controllers/learningController";

const router = Router();

router.get("/", listSessions);
router.post("/", createSessionHandler);
router.patch("/:id", updateSessionHandler);
router.delete("/:id", deleteSessionHandler);

export default router;
