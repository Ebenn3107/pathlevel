import { Router } from "express";
import { getXpSummaryHandler } from "../controllers/xpController";

const router = Router();

router.get("/", getXpSummaryHandler);

export default router;
