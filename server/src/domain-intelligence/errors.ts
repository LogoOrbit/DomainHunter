export class DomainValidationError extends Error {
  readonly statusCode = 400;
  readonly code = "INVALID_DOMAIN";

  constructor(message: string) {
    super(message);
    this.name = "DomainValidationError";
  }
}

export class DomainNotFoundError extends Error {
  readonly statusCode = 404;
  readonly code = "DOMAIN_NOT_FOUND";

  constructor(id: string) {
    super(`Domain analysis "${id}" was not found`);
    this.name = "DomainNotFoundError";
  }
}
