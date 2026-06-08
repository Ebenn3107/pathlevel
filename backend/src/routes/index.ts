import { Router } from "express";
import healthRoutes from "./healthRoutes";
import dashboardRoutes from "./dashboardRoutes";
import habitRoutes from "./habitRoutes";
import taskRoutes from "./taskRoutes";
import learningRoutes from "./learningRoutes";
import xpRoutes from "./xpRoutes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/habits", habitRoutes);
router.use("/tasks", taskRoutes);
router.use("/learning", learningRoutes);
router.use("/xp", xpRoutes);

export default router;
