import { Router } from "express";
import { registerHandler, loginHandler, meHandler } from "../controllers/authController";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.get("/me", authenticate, meHandler);

export default router;
