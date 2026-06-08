import { Router } from "express";
import {
  listResources,
  createResourceHandler,
  updateResourceHandler,
  deleteResourceHandler,
} from "../controllers/resourceController";

const router = Router();

router.get("/", listResources);
router.post("/", createResourceHandler);
router.patch("/:id", updateResourceHandler);
router.delete("/:id", deleteResourceHandler);

export default router;
