import { Router } from "express";
import { searchResourcesHandler } from "../controllers/searchController";

const router = Router();

router.get("/", searchResourcesHandler);

export default router;
