import { Router } from "express";
import { listAchievements, listMyAchievements } from "../controllers/achievementController";

const router = Router();

router.get("/", listAchievements);
router.get("/me", listMyAchievements);

export default router;
