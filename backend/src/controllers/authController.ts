import type { RequestHandler } from "express";
import { register, login, getMe } from "../services/authService";
import { getUserId } from "../middlewares/auth";

/** POST /api/auth/register */
export const registerHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = await register(req.body.email, req.body.username, req.body.password);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/** POST /api/auth/login */
export const loginHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = await login(req.body.email, req.body.password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/** GET /api/auth/me */
export const meHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const user = await getMe(userId);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
