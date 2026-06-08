import type { RequestHandler } from "express";
import { getTasks, createTask, updateTask, deleteTask } from "../services/taskService";
import { recordXp, XP_VALUES } from "../services/xpService";

const USER_ID = "placeholder-user-id"; // TODO: extract from authenticated request

/** GET /api/tasks */
export const listTasks: RequestHandler = async (_req, res, next) => {
  try {
    const tasks = await getTasks(USER_ID);
    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
};

/** POST /api/tasks */
export const createTaskHandler: RequestHandler = async (req, res, next) => {
  try {
    const task = await createTask(USER_ID, req.body);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/tasks/:id */
export const updateTaskHandler: RequestHandler = async (req, res, next) => {
  try {
    const task = await updateTask(req.params.id as string, USER_ID, req.body);

    // Award XP when a task is completed (idempotent via reference)
    if (req.body.completed === true) {
      await recordXp(USER_ID, XP_VALUES.task_completed, "task_completed", task.id).catch(() => {});
    }

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/tasks/:id */
export const deleteTaskHandler: RequestHandler = async (req, res, next) => {
  try {
    await deleteTask(req.params.id as string, USER_ID);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
