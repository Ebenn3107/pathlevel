import { Router } from "express";
import healthRoutes from "./healthRoutes";
import authRoutes from "./authRoutes";
import { authenticate } from "../middlewares/auth";
import dashboardRoutes from "./dashboardRoutes";
import habitRoutes from "./habitRoutes";
import taskRoutes from "./taskRoutes";
import learningRoutes from "./learningRoutes";
import xpRoutes from "./xpRoutes";
import resourceRoutes from "./resourceRoutes";
import achievementRoutes from "./achievementRoutes";

const router = Router();

// Public routes
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);

// Protected routes (require valid JWT)
router.use(authenticate);
router.use("/dashboard", dashboardRoutes);
router.use("/habits", habitRoutes);
router.use("/tasks", taskRoutes);
router.use("/learning", learningRoutes);
router.use("/xp", xpRoutes);
router.use("/resources", resourceRoutes);
router.use("/achievements", achievementRoutes);

export default router;
