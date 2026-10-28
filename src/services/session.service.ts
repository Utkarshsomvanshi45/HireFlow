import type { Session } from "@/types";

/**
 * Client-side demo session storage.
 *
 * This is prototype-only state for the mock flow. It is deliberately labelled
 * demo — real sessions, tokens and persistence belong to the Express backend
 * once it is connected. Nothing sensitive is ever stored here.
 */

const STORAGE_KEY = "hireflow.demo-session";

type Listener = (session: Session | null) => void;

let cached: Session | null | undefined;
const listeners = new Set<Listener>();

function readStorage(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function getSession(): Session | null {
  if (cached === undefined) cached = readStorage();
  return cached;
}

export function setSession(session: Session | null) {
  cached = session;
  if (typeof window !== "undefined") {
    try {
      if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable (private mode): session lives in memory only.
    }
  }
  listeners.forEach((listener) => listener(session));
}

export function clearSession() {
  setSession(null);
}

export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
