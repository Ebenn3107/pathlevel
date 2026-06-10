import { Router } from "express";
import rateLimit from "express-rate-limit";
import { registerHandler, loginHandler, meHandler } from "../controllers/authController";
import { authenticate } from "../middlewares/auth";

const router = Router();

// Rate limit auth endpoints to prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window per IP
  message: { success: false, message: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, registerHandler);
router.post("/login", authLimiter, loginHandler);
router.get("/me", authenticate, meHandler);

export default router;
