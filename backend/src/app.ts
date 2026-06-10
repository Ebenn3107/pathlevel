import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

/* ── Global middleware ─────────────────────────────────── */
app.use(helmet());
app.use(cors({ origin: config.isProd ? config.corsOrigin : true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Routes ────────────────────────────────────────────── */
app.use("/api", routes);

/* ── 404 catch-all ─────────────────────────────────────── */
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});

/* ── Error handling ────────────────────────────────────── */
app.use(errorHandler);

export default app;
