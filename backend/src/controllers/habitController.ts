import type { RequestHandler } from "express";
import { getHabits, createHabit, updateHabit, deleteHabit, completeHabit } from "../services/habitService";
import { evaluateAchievements } from "../services/achievementService";
import { getUserId } from "../middlewares/auth";

/** GET /api/habits */
export const listHabits: RequestHandler = async (req, res, next) => {
  try {
    const habits = await getHabits(getUserId(req));
    res.json({ success: true, data: habits });
  } catch (err) {
    next(err);
  }
};

/** POST /api/habits */
export const createHabitHandler: RequestHandler = async (req, res, next) => {
  try {
    const habit = await createHabit(getUserId(req), req.body);
    res.status(201).json({ success: true, data: habit });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/habits/:id */
export const updateHabitHandler: RequestHandler = async (req, res, next) => {
  try {
    const habit = await updateHabit(req.params.id as string, getUserId(req), req.body);
    res.json({ success: true, data: habit });
  } catch (err) {
    next(err);
  }
};

/** POST /api/habits/:id/complete */
export const completeHabitHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const result = await completeHabit(req.params.id as string, userId);

    // Evaluate achievements if this was a new completion
    let newAchievements: { code: string; title: string; icon: string }[] = [];
    if (result.isNew) {
      newAchievements = await evaluateAchievements(userId);
    }

    // 201 Created for new completions, 200 OK for duplicates
    const response: Record<string, unknown> = { success: true, data: result.habit };
    if (newAchievements.length > 0) {
      response.newAchievements = newAchievements;
    }
    res.status(result.isNew ? 201 : 200).json(response);
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/habits/:id */
export const deleteHabitHandler: RequestHandler = async (req, res, next) => {
  try {
    await deleteHabit(req.params.id as string, getUserId(req));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
