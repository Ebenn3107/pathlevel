import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";
import { config } from "../config";
import { NotFoundError, UnauthorizedError } from "../types/error";

const SALT_ROUNDS = 10;

export interface AuthTokens {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
}

/** Register a new user. */
export async function register(
  email: string,
  username: string,
  password: string,
): Promise<AuthTokens> {
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { email, username, password: hashed },
    select: { id: true, email: true, username: true },
  });

  const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
    expiresIn: "7d",
  });

  return { token, user };
}

/** Login with email and password. */
export async function login(
  email: string,
  password: string,
): Promise<AuthTokens> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, username: true, password: true },
  });

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
    expiresIn: "7d",
  });

  return {
    token,
    user: { id: user.id, email: user.email, username: user.username },
  };
}

/** Get the current user by ID. */
export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true, avatarUrl: true, xp: true, level: true, createdAt: true },
  });

  if (!user) {
    throw new NotFoundError("User");
  }

  return user;
}
