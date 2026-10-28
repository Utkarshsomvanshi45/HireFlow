import { useEffect, useState } from "react";
import { getSession, subscribeSession } from "@/services/session.service";
import type { Session } from "@/types";

export type SessionState = "loading" | Session;

/**
 * Client-side session hook. Returns "loading" during SSR and the first paint,
 * then the session (or null) once local state is read — so dashboards can
 * render skeletons without hydration mismatches.
 */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>("loading");

  useEffect(() => {
    setState(getSession());
    return subscribeSession((session) => setState(session));
  }, []);

  return state;
}
