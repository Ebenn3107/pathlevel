import type { RequestHandler } from "express";
import { getTasks, createTask, updateTask, deleteTask } from "../services/taskService";
import { getUserId } from "../middlewares/auth";

/** GET /api/tasks */
export const listTasks: RequestHandler = async (req, res, next) => {
  try {
    const tasks = await getTasks(getUserId(req));
    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
};

/** POST /api/tasks */
export const createTaskHandler: RequestHandler = async (req, res, next) => {
  try {
    const task = await createTask(getUserId(req), req.body);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/tasks/:id */
export const updateTaskHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    // XP award + achievement evaluation happen atomically inside updateTask
    const result = await updateTask(req.params.id as string, userId, req.body);

    const response: Record<string, unknown> = { success: true, data: result.task };
    if (result.newAchievements && result.newAchievements.length > 0) {
      response.newAchievements = result.newAchievements;
    }
    res.json(response);
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/tasks/:id */
export const deleteTaskHandler: RequestHandler = async (req, res, next) => {
  try {
    await deleteTask(req.params.id as string, getUserId(req));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
