import type { RequestHandler } from "express";
import { getHabits, createHabit, updateHabit, deleteHabit } from "../services/habitService";

/** GET /api/habits */
export const listHabits: RequestHandler = async (_req, res, next) => {
  try {
    // TODO: extract userId from authenticated request
    const habits = await getHabits("placeholder-user-id");
    res.json({ success: true, data: habits });
  } catch (err) {
    next(err);
  }
};

/** POST /api/habits */
export const createHabitHandler: RequestHandler = async (req, res, next) => {
  try {
    // TODO: extract userId from authenticated request
    const habit = await createHabit("placeholder-user-id", req.body);
    res.status(201).json({ success: true, data: habit });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/habits/:id */
export const updateHabitHandler: RequestHandler = async (req, res, next) => {
  try {
    // TODO: extract userId from authenticated request
    const habit = await updateHabit(req.params.id as string, "placeholder-user-id", req.body);
    res.json({ success: true, data: habit });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/habits/:id */
export const deleteHabitHandler: RequestHandler = async (req, res, next) => {
  try {
    // TODO: extract userId from authenticated request
    await deleteHabit(req.params.id as string, "placeholder-user-id");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
