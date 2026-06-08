export class NotFoundError extends Error {
  statusCode = 404;

  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;

  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;

  constructor(message = "Access denied") {
    super(message);
    this.name = "ForbiddenError";
  }
}