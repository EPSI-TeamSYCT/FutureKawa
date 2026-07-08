import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger";
import type { Errors } from "../types/errors.enum";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: Errors,
    detail?: string,
  ) {
    super(detail ? `${message}: ${detail}` : message);
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  logger.error({ err }, "unhandled error");
  res.status(500).json({ error: "internal_error" });
}
