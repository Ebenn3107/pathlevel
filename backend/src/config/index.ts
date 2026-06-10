import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

interface Config {
  nodeEnv: string;
  port: number;
  corsOrigin: string;
  jwtSecret: string;
  databaseUrl: string;
  isDev: boolean;
  isProd: boolean;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Ensure ${name} is set in .env or the environment.\n` +
      `See .env.example for reference.`,
    );
  }
  return value;
}

export const config: Config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "4000", 10),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  jwtSecret: requireEnv("JWT_SECRET"),
  databaseUrl: requireEnv("DATABASE_URL"),
  isDev: process.env.NODE_ENV !== "production",
  isProd: process.env.NODE_ENV === "production",
};
