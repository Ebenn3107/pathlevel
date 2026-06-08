import type { RequestHandler } from "express";
import { getHabits, createHabit, updateHabit, deleteHabit, completeHabit } from "../services/habitService";
import { recordXp, XP_VALUES } from "../services/xpService";

const USER_ID = "placeholder-user-id"; // TODO: extract from authenticated request

/** GET /api/habits */
export const listHabits: RequestHandler = async (_req, res, next) => {
  try {
    const habits = await getHabits(USER_ID);
    res.json({ success: true, data: habits });
  } catch (err) {
    next(err);
  }
};

/** POST /api/habits */
export const createHabitHandler: RequestHandler = async (req, res, next) => {
  try {
    const habit = await createHabit(USER_ID, req.body);
    res.status(201).json({ success: true, data: habit });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/habits/:id */
export const updateHabitHandler: RequestHandler = async (req, res, next) => {
  try {
    const habit = await updateHabit(req.params.id as string, USER_ID, req.body);
    res.json({ success: true, data: habit });
  } catch (err) {
    next(err);
  }
};

/** POST /api/habits/:id/complete */
export const completeHabitHandler: RequestHandler = async (req, res, next) => {
  try {
    const habit = await completeHabit(req.params.id as string, USER_ID);
    // Award XP for each habit completion (no idempotency — every completion counts)
    await recordXp(USER_ID, XP_VALUES.habit_completed, "habit_completed").catch(() => {});
    res.json({ success: true, data: habit });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/habits/:id */
export const deleteHabitHandler: RequestHandler = async (req, res, next) => {
  try {
    await deleteHabit(req.params.id as string, USER_ID);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
