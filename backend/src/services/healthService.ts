import { config } from "../config";

export interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

/** Check service health. */
export async function getHealth(): Promise<HealthStatus> {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  };
}
