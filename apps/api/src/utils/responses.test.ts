import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import {
  badRequest,
  internalError,
  unsupportedMediaType,
  validationError,
} from './responses';

const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

describe('badRequest', () => {
  it('returns 400 with error message', () => {
    const res = createMockResponse();

    badRequest(res, 'Something went wrong');

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'Something went wrong',
    });
  });
});

describe('validationError', () => {
  it('returns 400 with validation details', () => {
    const res = createMockResponse();
    const issues = [{ code: 'invalid_type', path: ['name'], message: 'Required' }];

    validationError(res, 'Invalid data', issues as never);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation Error',
      message: 'Invalid data',
      details: issues,
    });
  });

  it('works without details', () => {
    const res = createMockResponse();

    validationError(res, 'Invalid data');

    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation Error',
      message: 'Invalid data',
      details: undefined,
    });
  });
});

describe('unsupportedMediaType', () => {
  it('returns 415 with expected type', () => {
    const res = createMockResponse();

    unsupportedMediaType(res, 'text/xml+markr');

    expect(res.status).toHaveBeenCalledWith(415);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unsupported Media Type',
      message: 'Expected content-type: text/xml+markr',
    });
  });
});

describe('internalError', () => {
  it('returns 500 with generic message', () => {
    const res = createMockResponse();

    internalError(res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
  });
});

