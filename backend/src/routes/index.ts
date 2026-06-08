import { Router } from "express";
import healthRoutes from "./healthRoutes";
import dashboardRoutes from "./dashboardRoutes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
