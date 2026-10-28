import { useEffect, useState } from "react";
import { getSession, subscribeSession } from "@/services/session.service";
import { fetchCurrentUser } from "@/services/auth.service";
import { USE_MOCKS } from "@/services/api-client";
import type { Session } from "@/types";

export type SessionState = "loading" | Session | null;

/**
 * Client-side session hook. Returns "loading" on first paint,
 * then the verified session (or null) once local/server state is read.
 */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>("loading");

  useEffect(() => {
    // 1. Initial cached state
    setState(getSession());

    // 2. If connected to real API, verify current session cookie with backend
    if (!USE_MOCKS) {
      fetchCurrentUser().catch(() => {});
    }

    // 3. Listen to state changes
    return subscribeSession((session) => setState(session));
  }, []);

  return state;
}
