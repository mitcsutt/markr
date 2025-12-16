import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleAggregate } from './results';

vi.mock('@repo/db/services/aggregate', () => ({
  getTestAggregate: vi.fn(),
}));

import { getTestAggregate } from '@repo/db/services/aggregate';

const createMockRequest = (testId: string): Request<{ testId: string }> =>
  ({
    params: { testId },
  }) as unknown as Request<{ testId: string }>;

const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

describe('handleAggregate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when test not found', async () => {
    const req = createMockRequest('nonexistent');
    const res = createMockResponse();
    vi.mocked(getTestAggregate).mockResolvedValue(null);

    await handleAggregate(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Not Found',
        message: 'Test nonexistent not found',
      }),
    );
  });

  it('returns empty aggregate when test has no submissions', async () => {
    const req = createMockRequest('test-001');
    const res = createMockResponse();
    vi.mocked(getTestAggregate).mockResolvedValue({
      mean: 0,
      stddev: 0,
      count: 0,
      p25: 0,
      p50: 0,
      p75: 0,
      min: 0,
      max: 0,
    });

    await handleAggregate(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ count: 0 }),
    );
  });

  it('returns aggregate data for existing test', async () => {
    const req = createMockRequest('test-001');
    const res = createMockResponse();
    const mockAggregate = {
      mean: 65,
      stddev: 15.5,
      count: 10,
      p25: 50,
      p50: 65,
      p75: 80,
      min: 30,
      max: 100,
    };
    vi.mocked(getTestAggregate).mockResolvedValue(mockAggregate);

    await handleAggregate(req, res);

    expect(getTestAggregate).toHaveBeenCalledWith('test-001');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockAggregate);
  });

  it('returns 500 on unexpected errors', async () => {
    const req = createMockRequest('test-001');
    const res = createMockResponse();
    vi.mocked(getTestAggregate).mockRejectedValue(new Error('DB error'));

    await handleAggregate(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Internal Server Error' }),
    );
  });
});
