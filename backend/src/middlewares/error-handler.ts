import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  console.error("[ServerError]", err);

  const status = (err as { status?: number }).status || 500;
  const message =
    process.env.NODE_ENV === "production" && status === 500
      ? "An unexpected internal server error occurred."
      : err.message || "An unexpected error occurred.";

  res.status(status).json({ message });
}

