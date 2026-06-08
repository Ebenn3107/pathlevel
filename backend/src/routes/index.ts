import { Router } from "express";
import healthRoutes from "./healthRoutes";
import dashboardRoutes from "./dashboardRoutes";
import habitRoutes from "./habitRoutes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/habits", habitRoutes);

export default router;
