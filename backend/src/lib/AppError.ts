export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string>;

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }

  static badRequest(message: string, fields?: Record<string, string>) {
    return new AppError(400, "bad_request", message, fields);
  }

  static unauthorized(message = "Authentication required") {
    return new AppError(401, "unauthorized", message);
  }

  static forbidden(message = "You do not have permission to perform this action") {
    return new AppError(403, "forbidden", message);
  }

  static notFound(message = "Resource not found") {
    return new AppError(404, "not_found", message);
  }

  static conflict(message: string) {
    return new AppError(409, "conflict", message);
  }
}
