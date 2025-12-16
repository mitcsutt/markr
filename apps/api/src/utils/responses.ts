import type { Response } from 'express';
import type { ZodIssue } from 'zod';

/**
 * Standard error response shape.
 */
interface ErrorResponse {
  error: string;
  message: string;
  details?: ZodIssue[];
}

export function badRequest(res: Response, message: string): void {
  res.status(400).json({
    error: 'Bad Request',
    message,
  } satisfies ErrorResponse);
}

export function validationError(
  res: Response,
  message: string,
  details?: ZodIssue[],
): void {
  res.status(400).json({
    error: 'Validation Error',
    message,
    details,
  } satisfies ErrorResponse);
}

export function unsupportedMediaType(
  res: Response,
  expectedType: string,
): void {
  res.status(415).json({
    error: 'Unsupported Media Type',
    message: `Expected content-type: ${expectedType}`,
  } satisfies ErrorResponse);
}

export function internalError(res: Response): void {
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  } satisfies ErrorResponse);
}
