import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma.js";
import { config } from "../config/env.js";
import type { User, Role } from "@prisma/client";

export interface AuthenticatedRequest extends Request {
  user?: User;
  sessionId?: string;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function setSessionCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(config.sessionCookieName, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? "none" : "lax",
    expires: expiresAt,
    path: "/",
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(config.sessionCookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? "none" : "lax",
    path: "/",
  });
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  let token = req.cookies?.[config.sessionCookieName];
  const authHeader = req.headers.authorization;
  if (!token && authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  }

  if (!token || typeof token !== "string") {
    return next();
  }

  try {
    const tokenHash = hashToken(token);
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session) {
      clearSessionCookie(res);
      return next();
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      clearSessionCookie(res);
      return next();
    }

    req.user = session.user;
    req.sessionId = session.id;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ message: "Authentication required. Please sign in." });
    return;
  }
  next();
}

export function requireRole(allowedRole: Role) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required. Please sign in." });
      return;
    }

    if (req.user.role !== allowedRole) {
      res.status(403).json({
        message: `Forbidden: this action requires ${allowedRole.toLowerCase()} access.`,
      });
      return;
    }

    next();
  };
}

