import { api, mockDelay, USE_MOCKS } from "./api-client";
import { getSession, setSession } from "./session.service";
import {
  DEMO_CREDENTIALS,
  demoCandidate,
  demoEmployer,
  mockUsers,
} from "@/data/mock/users";
import type { RegisterInput, Session, User } from "@/types";

/**
 * Authentication service.
 *
 * When USE_MOCKS is false, connects to Express + Prisma backend via HTTP-only
 * session cookies. When true, falls back to in-memory demo data.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCredentials(email: string, password: string): string | null {
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

export async function login(email: string, password: string): Promise<Session> {
  if (!USE_MOCKS) {
    const res = await api.post<{ user: User; token?: string }>("/auth/login", { email, password });
    if (res.token && typeof window !== 'undefined') {
      localStorage.setItem('hireflow_token', res.token);
    }
    const session: Session = { user: res.user, token: res.token };
    setSession(session);
    return session;
  }

  await mockDelay(400);
  const problem = validateCredentials(email, password);
  if (problem) throw new Error(problem);

  const normalized = email.trim().toLowerCase();
  const existing =
    mockUsers.find((user) => user.email.toLowerCase() === normalized) ??
    ({
      ...demoCandidate,
      id: `user-demo-${normalized.replace(/[^a-z0-9]/g, "-")}`,
      name: email
        .split("@")[0]
        .split(/[._-]/)
        .filter(Boolean)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(" "),
      email: normalized,
    } satisfies User);

  const session: Session = { user: existing };
  setSession(session);
  return session;
}

export async function register(input: RegisterInput): Promise<Session> {
  if (!USE_MOCKS) {
    const res = await api.post<{ user: User; token?: string }>("/auth/register", input);
    if (res.token && typeof window !== 'undefined') {
      localStorage.setItem('hireflow_token', res.token);
    }
    const session: Session = { user: res.user, token: res.token };
    setSession(session);
    return session;
  }

  await mockDelay(450);
  const problem = validateCredentials(input.email, input.password);
  if (problem) throw new Error(problem);
  if (!input.name.trim()) throw new Error("Enter your full name.");
  if (input.role === "employer" && !input.companyName?.trim())
    throw new Error("Enter your company name.");

  const user: User = {
    id: `user-demo-${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    companyName: input.role === "employer" ? input.companyName!.trim() : undefined,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  const session: Session = { user };
  setSession(session);
  return session;
}

/** Restores the current session, verifying it against the backend when wired up. */
export async function fetchCurrentUser(): Promise<User | null> {
  if (!USE_MOCKS) {
    try {
      const user = await api.get<User>("/auth/me");
      if (user) {
        const currentSession = getSession();
        setSession({ user, token: currentSession?.token });
        return user;
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('hireflow_token');
        }
        setSession(null);
        return null;
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('hireflow_token');
        }
        setSession(null);
        return null;
      }
      return getSession()?.user ?? null;
    }
  }
  return getSession()?.user ?? null;
}

export async function logout(): Promise<void> {
  if (!USE_MOCKS) {
    await api.post("/auth/logout").catch(() => {});
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem('hireflow_token');
  }
  setSession(null);
}

export const demoCredentials = DEMO_CREDENTIALS;
export const demoEmployerUser = demoEmployer;
