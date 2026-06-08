import express from "express";
import cors from "cors";
import { config } from "./config";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

/* ── Global middleware ─────────────────────────────────── */
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Routes ────────────────────────────────────────────── */
app.use("/api", routes);

/* ── Error handling ────────────────────────────────────── */
app.use(errorHandler);

export default app;
