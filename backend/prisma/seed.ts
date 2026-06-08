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
