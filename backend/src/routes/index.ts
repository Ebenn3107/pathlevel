import { Router } from "express";
import healthRoutes from "./healthRoutes";
import authRoutes from "./authRoutes";
import { authenticate } from "../middlewares/auth";
import dashboardRoutes from "./dashboardRoutes";
import habitRoutes from "./habitRoutes";
import taskRoutes from "./taskRoutes";
import learningRoutes from "./learningRoutes";
import learningGoalRoutes from "./learningGoalRoutes";
import learningUnitRoutes from "./learningUnitRoutes";
import xpRoutes from "./xpRoutes";
import resourceRoutes from "./resourceRoutes";
import achievementRoutes from "./achievementRoutes";
import searchRoutes from "./searchRoutes";

const router = Router();

// Public routes
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);

// Protected routes (require valid JWT)
router.use(authenticate);
router.use("/dashboard", dashboardRoutes);
router.use("/habits", habitRoutes);
router.use("/tasks", taskRoutes);
// Learning sub-domains mounted before the legacy session log so paths
// like /api/learning/goals and /api/learning/units resolve correctly.
router.use("/learning/goals", learningGoalRoutes);
router.use("/learning/units", learningUnitRoutes);
router.use("/learning", learningRoutes);
router.use("/xp", xpRoutes);
router.use("/resources", resourceRoutes);
router.use("/search", searchRoutes);
router.use("/achievements", achievementRoutes);

export default router;
