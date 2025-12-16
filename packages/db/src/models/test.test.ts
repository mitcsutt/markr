import { beforeEach, describe, expect, it, vi } from 'vitest';
import { upsertTests } from './test';

vi.mock('../client', () => import('../__mocks__/client'));

import { prisma } from '../__mocks__/client';

describe('upsertTests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('upserts a single test and returns map', async () => {
    prisma.test.upsert.mockResolvedValue({
      id: 1,
      testId: 'test-001',
    });

    const result = await upsertTests(['test-001']);

    expect(prisma.test.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.test.upsert).toHaveBeenCalledWith({
      where: { testId: 'test-001' },
      update: {},
      create: { testId: 'test-001' },
      select: { id: true, testId: true },
    });
    expect(result.get('test-001')).toEqual({ id: 1, testId: 'test-001' });
  });

  it('deduplicates test IDs', async () => {
    prisma.test.upsert.mockResolvedValue({
      id: 1,
      testId: 'test-001',
    });

    await upsertTests(['test-001', 'test-001', 'test-001']);

    expect(prisma.test.upsert).toHaveBeenCalledTimes(1);
  });

  it('handles multiple unique tests in parallel', async () => {
    prisma.test.upsert
      .mockResolvedValueOnce({ id: 1, testId: 'test-001' })
      .mockResolvedValueOnce({ id: 2, testId: 'test-002' });

    const result = await upsertTests(['test-001', 'test-002']);

    expect(prisma.test.upsert).toHaveBeenCalledTimes(2);
    expect(result.size).toBe(2);
    expect(result.get('test-001')?.id).toBe(1);
    expect(result.get('test-002')?.id).toBe(2);
  });

  it('returns empty map for empty input', async () => {
    const result = await upsertTests([]);

    expect(prisma.test.upsert).not.toHaveBeenCalled();
    expect(result.size).toBe(0);
  });
});
