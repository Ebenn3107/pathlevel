import { Router } from "express";
import healthRoutes from "./healthRoutes";
import dashboardRoutes from "./dashboardRoutes";
import habitRoutes from "./habitRoutes";
import taskRoutes from "./taskRoutes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/habits", habitRoutes);
router.use("/tasks", taskRoutes);

export default router;
