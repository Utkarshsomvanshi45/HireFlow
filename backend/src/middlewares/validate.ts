import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodTypeAny } from "zod";

export function validateBody(schema: ZodTypeAny) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        res.status(400).json({
          message: issues[0]?.message || "Validation failed.",
          errors: issues,
        });
        return;
      }
      next(error);
    }
  };
}

export function validateQuery(schema: ZodTypeAny) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = (await schema.parseAsync(req.query)) as Request["query"];
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: error.issues[0]?.message || "Invalid query parameters.",
          errors: error.issues,
        });
        return;
      }
      next(error);
    }
  };
}
