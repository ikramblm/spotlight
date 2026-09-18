import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { AppError } from "../lib/AppError";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { code: "not_found", message: "Route not found" } });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.fields ? { fields: err.fields } : {}) },
    });
  }

  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "File is too large (max 5MB)" : "File upload failed";
    return res.status(400).json({ error: { code: "bad_request", message } });
  }

  // body-parser's own errors (thrown before any route/controller runs) carry their real HTTP
  // status on `.status`/`.statusCode` - without this branch they'd fall through to the generic
  // 500 below, which is both the wrong status code and a worse error message for a client
  // mistake (a too-large body, malformed JSON) that isn't actually a server fault.
  if (typeof err === "object" && err !== null && "type" in err) {
    const bodyParserErr = err as { type?: string; status?: number; statusCode?: number };
    if (bodyParserErr.type === "entity.too.large") {
      return res.status(413).json({ error: { code: "payload_too_large", message: "Request body is too large" } });
    }
    if (bodyParserErr.type === "entity.parse.failed") {
      return res.status(400).json({ error: { code: "bad_request", message: "Malformed JSON body" } });
    }
  }

  // eslint-disable-next-line no-console
  console.error("Unhandled error:", err);
  return res.status(500).json({ error: { code: "internal_error", message: "Something went wrong" } });
}
