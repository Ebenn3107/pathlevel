import app from "./app";
import { config } from "./config";
import { syncAchievementDefinitions } from "./services/achievementService";

/**
 * Startup bootstrap.
 *
 * Achievement definitions are synchronized from the canonical code source
 * into the database at startup (idempotent upserts, see
 * syncAchievementDefinitions). The database remains the runtime source of
 * truth for achievement APIs and evaluation.
 */
async function bootstrap() {
  await syncAchievementDefinitions();
}

bootstrap()
  .then(() => {
    app.listen(config.port, () => {
      console.log(
        `[server] PathLevel backend running on http://localhost:${config.port} (${config.nodeEnv})`,
      );
    });
  })
  .catch((err) => {
    console.error("[server] Startup failed:", err);
    process.exit(1);
  });
