import type { RequestHandler } from "express";
import { getTasks, createTask, updateTask, deleteTask } from "../services/taskService";

/** GET /api/tasks */
export const listTasks: RequestHandler = async (_req, res, next) => {
  try {
    // TODO: extract userId from authenticated request
    const tasks = await getTasks("placeholder-user-id");
    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
};

/** POST /api/tasks */
export const createTaskHandler: RequestHandler = async (req, res, next) => {
  try {
    // TODO: extract userId from authenticated request
    const task = await createTask("placeholder-user-id", req.body);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/tasks/:id */
export const updateTaskHandler: RequestHandler = async (req, res, next) => {
  try {
    // TODO: extract userId from authenticated request
    const task = await updateTask(req.params.id as string, "placeholder-user-id", req.body);
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/tasks/:id */
export const deleteTaskHandler: RequestHandler = async (req, res, next) => {
  try {
    // TODO: extract userId from authenticated request
    await deleteTask(req.params.id as string, "placeholder-user-id");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
