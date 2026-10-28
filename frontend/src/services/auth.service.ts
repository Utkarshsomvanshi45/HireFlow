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
 * While USE_MOCKS is true this is a labelled demo flow: any valid email with
 * an 8+ character password signs into sample data, and nothing pretends to be
 * production auth. The real-API branch below is the contract the Express
 * backend will implement (POST /auth/login, POST /auth/register, GET /auth/me).
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCredentials(email: string, password: string): string | null {
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

export async function login(email: string, password: string): Promise<Session> {
  if (!USE_MOCKS) {
    const session = await api.post<Session>("/auth/login", { email, password });
    setSession(session);
    return session;
  }

  await mockDelay(400);
  const problem = validateCredentials(email, password);
  if (problem) throw new Error(problem);

  const normalized = email.trim().toLowerCase();
  const existing =
    mockUsers.find((user) => user.email.toLowerCase() === normalized) ??
    // Unknown email: sign in as a fresh candidate with sample data attached.
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
    const session = await api.post<Session>("/auth/register", input);
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
      return user;
    } catch {
      return null;
    }
  }
  return getSession()?.user ?? null;
}

export function logout(): void {
  setSession(null);
}

export const demoCredentials = DEMO_CREDENTIALS;
export const demoEmployerUser = demoEmployer;
