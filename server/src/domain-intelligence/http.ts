import { DomainNotFoundError, DomainValidationError } from "./errors.ts";
import { LeadDiscoveryError } from "../lead-discovery/errors.ts";

export type ErrorPayload = { error: { code: string; message: string } };

export function toErrorResponse(error: unknown): { statusCode: number; payload: ErrorPayload } {
  if (error instanceof DomainValidationError || error instanceof DomainNotFoundError) {
    return { statusCode: error.statusCode, payload: { error: { code: error.code, message: error.message } } };
  }
  if (error instanceof LeadDiscoveryError) return { statusCode: error.statusCode, payload: { error: { code: error.code, message: error.message } } };
  if (isFastifyValidationError(error)) {
    return { statusCode: 400, payload: { error: { code: "VALIDATION_ERROR", message: error.message } } };
  }
  return { statusCode: 500, payload: { error: { code: "INTERNAL_ERROR", message: "The domain intelligence request could not be completed" } } };
}

function isFastifyValidationError(error: unknown): error is { message: string; validation: unknown } {
  return error instanceof Error && "validation" in error;
}

export function parsePageSize(value: string | null | undefined): number {
  const defaultSize = positiveInteger(process.env.DOMAIN_HISTORY_PAGE_SIZE, 50);
  const maximumSize = positiveInteger(process.env.DOMAIN_HISTORY_MAX_PAGE_SIZE, 200);
  if (!value) return Math.min(defaultSize, maximumSize);
  const size = Number(value);
  if (!Number.isInteger(size) || size < 1 || size > maximumSize) {
    throw new DomainValidationError(`pageSize must be between 1 and ${maximumSize}`);
  }
  return size;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
