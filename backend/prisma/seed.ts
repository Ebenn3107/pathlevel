import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({
  adapter,
});

const DEMO_USER_ID = "placeholder-user-id";

import bcrypt from "bcryptjs";

const DEMO_USER = {
  id: DEMO_USER_ID,
  email: "demo@pathlevel.app",
  username: "demouser",
  password: bcrypt.hashSync("password123", 10),
  avatarUrl: null,
};

const ACHIEVEMENT_SEEDS = [
  /* ── XP ────────────────────────────────────── */
  { code: "XP_100", title: "Getting Started", description: "Earn 100 total XP", icon: "⚡" },
  { code: "XP_500", title: "Half Way There", description: "Earn 500 total XP", icon: "🔥" },
  { code: "XP_1000", title: "XP Champion", description: "Earn 1,000 total XP", icon: "💎" },
  /* ── Habits ────────────────────────────────── */
  { code: "FIRST_HABIT", title: "First Step", description: "Complete your first habit", icon: "🌱" },
  { code: "HABIT_10", title: "Getting Consistent", description: "Complete 10 habits", icon: "🌿" },
  { code: "HABIT_50", title: "Habit Machine", description: "Complete 50 habits", icon: "🌳" },
  /* ── Streaks ───────────────────────────────── */
  { code: "STREAK_7", title: "Week Warrior", description: "Reach a 7-day streak on any habit", icon: "📅" },
  { code: "STREAK_30", title: "Monthly Master", description: "Reach a 30-day streak on any habit", icon: "🏆" },
  /* ── Tasks ─────────────────────────────────── */
  { code: "FIRST_TASK", title: "Task Initiated", description: "Complete your first task", icon: "✅" },
  { code: "TASK_25", title: "Task Crusher", description: "Complete 25 tasks", icon: "📋" },
  /* ── Learning ──────────────────────────────── */
  { code: "FIRST_SESSION", title: "Curious Mind", description: "Complete your first learning session", icon: "📚" },
  { code: "SESSION_10", title: "Dedicated Learner", description: "Complete 10 learning sessions", icon: "🎓" },
];

async function main() {
  console.log(`[seed] Checking for demo user: ${DEMO_USER.email}...`);

  const existing = await prisma.user.findUnique({
    where: { id: DEMO_USER_ID },
  });

  if (existing) {
    console.log("[seed] Demo user already exists — updating username/email.");
    await prisma.user.update({
      where: { id: DEMO_USER_ID },
      data: {
        email: DEMO_USER.email,
        username: DEMO_USER.username,
      },
    });
  } else {
    console.log("[seed] Creating demo user...");
    await prisma.user.create({
      data: DEMO_USER,
    });
    console.log("[seed] Demo user created.");
  }

  // Sync achievement definitions
  console.log("[seed] Syncing achievement definitions...");
  for (const def of ACHIEVEMENT_SEEDS) {
    await prisma.achievement.upsert({
      where: { code: def.code },
      update: { title: def.title, description: def.description, icon: def.icon },
      create: { code: def.code, title: def.title, description: def.description, icon: def.icon },
    });
  }
  console.log(`[seed] Synced ${ACHIEVEMENT_SEEDS.length} achievements.`);
  console.log("[seed] Done.");
}

main()
  .catch((e) => {
    console.error("[seed] Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
