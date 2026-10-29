/**
 * Centralized API client.
 *
 * Every frontend request goes through this module. The backend base URL is
 * read once from the VITE_API_BASE_URL environment variable — never hardcode
 * API URLs in pages or components.
 *
 * When VITE_API_BASE_URL is not configured (the default in this prototype),
 * USE_MOCKS is true and service modules fall back to the mock data store in
 * src/data/mock. The API layer below is real, typed fetch code that the
 * separately deployed Express + Prisma + Neon backend serves directly.
 */

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

/** True while the app runs on mock data instead of the real backend. */
export const USE_MOCKS = API_BASE_URL === "";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Optional bearer token if not using cookies */
  token?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (USE_MOCKS) {
    throw new ApiError(
      "API base URL is not configured — the app is running on mock data.",
      501,
    );
  }

  let response: Response;
  try {
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    const token = options.token || (typeof window !== "undefined" ? localStorage.getItem("hireflow_token") : null);
    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      credentials: "include", // Send and receive HTTP-only session cookies
      headers,
      body: isFormData
        ? (options.body as FormData)
        : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
    });
  } catch {
    throw new ApiError("Network request failed. Check your connection and try again.");
  }

  if (!response.ok) {
    const message = await response
      .json()
      .then((data) => (data && typeof data.message === "string" ? data.message : null))
      .catch(() => null);
    throw new ApiError(message ?? `Request failed with status ${response.status}.`, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

/** Simulated latency for mock responses so loading states are exercised. */
export const mockDelay = (ms = 350) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
