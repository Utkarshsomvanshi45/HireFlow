import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Response, Request } from "express";
import { prisma } from "../db/prisma.js";
import {
  generateSessionToken,
  hashToken,
  setSessionCookie,
  clearSessionCookie,
  type AuthenticatedRequest,
} from "../middlewares/auth.js";
import { config } from "../config/env.js";
import { Role, type User } from "@prisma/client";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["candidate", "employer"]).default("candidate"),
  companyName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  title: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

export function toSafeUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.toLowerCase() as "candidate" | "employer",
    title: user.title ?? undefined,
    location: user.location ?? undefined,
    phone: user.phone ?? undefined,
    companyName: user.companyName ?? undefined,
    resumeName: user.resumeName ?? undefined,
    resumeUpdatedAt: user.resumeUpdatedAt ? user.resumeUpdatedAt.toISOString().slice(0, 10) : undefined,
    bio: user.bio ?? undefined,
    createdAt: user.createdAt.toISOString().slice(0, 10),
  };
}

export async function createSession(res: Response, userId: string): Promise<string> {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + config.sessionDurationDays * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  setSessionCookie(res, token, expiresAt);
  return token;
}

// Known demo accounts used by the frontend prototype quick-fill buttons
const DEMO_PRESETS: Record<
  string,
  { name: string; role: Role; companyName?: string; validPasswords: string[] }
> = {
  "priya.sharma@example.com": {
    name: "Priya Sharma",
    role: Role.CANDIDATE,
    validPasswords: ["hireflow-demo", "password123"],
  },
  "marcus@northwindlabs.com": {
    name: "Marcus Chen",
    role: Role.EMPLOYER,
    companyName: "Northwind Labs",
    validPasswords: ["hireflow-demo", "password123"],
  },
  "sofia@example.com": {
    name: "Sofia Chen",
    role: Role.CANDIDATE,
    validPasswords: ["password123", "hireflow-demo"],
  },
  "elena@acme.corp": {
    name: "Elena Vance",
    role: Role.EMPLOYER,
    companyName: "Acme Corp",
    validPasswords: ["password123", "hireflow-demo"],
  },
};

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password, role, companyName } = req.body;

  if (role === "employer" && (!companyName || !companyName.trim())) {
    res.status(400).json({ message: "Company name is required for employers." });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ message: "An account with this email already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email,
      passwordHash,
      role: role === "employer" ? Role.EMPLOYER : Role.CANDIDATE,
      companyName: role === "employer" ? companyName?.trim() : null,
    },
  });

  const token = await createSession(res, user.id);

  res.status(201).json({
    user: toSafeUser(user),
    token,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Handle demo accounts gracefully if they don't exist yet or if using demo passwords
  const demoPreset = DEMO_PRESETS[normalizedEmail];
  if (demoPreset && demoPreset.validPasswords.includes(password)) {
    if (!user) {
      const passwordHash = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          name: demoPreset.name,
          email: normalizedEmail,
          passwordHash,
          role: demoPreset.role,
          companyName: demoPreset.companyName ?? null,
        },
      });
    }

    const token = await createSession(res, user.id);
    res.status(200).json({ user: toSafeUser(user), token });
    return;
  }

  if (!user) {
    res.status(401).json({ message: "Invalid email or password." });
    return;
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    res.status(401).json({ message: "Invalid email or password." });
    return;
  }

  const token = await createSession(res, user.id);

  res.status(200).json({
    user: toSafeUser(user),
    token,
  });
}

export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (req.sessionId) {
    await prisma.session.delete({ where: { id: req.sessionId } }).catch(() => {});
  }
  clearSessionCookie(res);
  res.status(200).json({ message: "Signed out successfully." });
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  res.status(200).json(toSafeUser(req.user));
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: req.body,
  });

  res.status(200).json(toSafeUser(updated));
}
