import { config } from "../config";
import { prisma } from "../config/database";

export interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  database: string;
}

/** Check service health including database connectivity. */
export async function getHealth(): Promise<HealthStatus> {
  let dbStatus = "disconnected";
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch {
    dbStatus = "error";
  }

  return {
    status: dbStatus === "connected" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    database: dbStatus,
  };
}
