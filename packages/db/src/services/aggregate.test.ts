import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTestAggregate } from './aggregate';

vi.mock('../client', () => ({
  prisma: {
    test: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '../client';

describe('getTestAggregate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when test not found', async () => {
    vi.mocked(prisma.test.findUnique).mockResolvedValue(null);

    const result = await getTestAggregate('nonexistent');

    expect(result).toBeNull();
  });

  it('returns empty aggregate when test has no submissions', async () => {
    vi.mocked(prisma.test.findUnique).mockResolvedValue({
      id: 1,
      testId: 'test-001',
      submissions: [],
    } as never);

    const result = await getTestAggregate('test-001');

    expect(result).toEqual({
      mean: 0,
      stddev: 0,
      count: 0,
      p25: 0,
      p50: 0,
      p75: 0,
      min: 0,
      max: 0,
    });
  });

  it('calculates correct aggregate for single submission', async () => {
    vi.mocked(prisma.test.findUnique).mockResolvedValue({
      id: 1,
      testId: 'test-001',
      submissions: [{ obtained: 13, available: 20 }],
    } as never);

    const result = await getTestAggregate('test-001');

    expect(result).toEqual({
      mean: 65,
      stddev: 0,
      count: 1,
      p25: 65,
      p50: 65,
      p75: 65,
      min: 65,
      max: 65,
    });
  });

  it('calculates correct percentages and stddev', async () => {
    vi.mocked(prisma.test.findUnique).mockResolvedValue({
      id: 1,
      testId: 'test-001',
      submissions: [
        { obtained: 10, available: 20 }, // 50%
        { obtained: 15, available: 20 }, // 75%
        { obtained: 20, available: 20 }, // 100%
      ],
    } as never);

    const result = await getTestAggregate('test-001');

    expect(result?.mean).toBe(75);
    expect(result?.stddev).toBe(20.41); // sqrt(((50-75)^2 + (75-75)^2 + (100-75)^2) / 3)
    expect(result?.count).toBe(3);
    expect(result?.min).toBe(50);
    expect(result?.max).toBe(100);
  });

  it('calculates percentiles correctly', async () => {
    // 4 submissions: 25%, 50%, 75%, 100%
    vi.mocked(prisma.test.findUnique).mockResolvedValue({
      id: 1,
      testId: 'test-001',
      submissions: [
        { obtained: 5, available: 20 }, // 25%
        { obtained: 10, available: 20 }, // 50%
        { obtained: 15, available: 20 }, // 75%
        { obtained: 20, available: 20 }, // 100%
      ],
    } as never);

    const result = await getTestAggregate('test-001');

    // Linear interpolation: index = p * (n-1)
    expect(result?.p25).toBe(43.75);
    expect(result?.p50).toBe(62.5);
    expect(result?.p75).toBe(81.25);
  });

  it('handles zero available marks gracefully', async () => {
    vi.mocked(prisma.test.findUnique).mockResolvedValue({
      id: 1,
      testId: 'test-001',
      submissions: [{ obtained: 10, available: 0 }],
    } as never);

    const result = await getTestAggregate('test-001');

    expect(result?.mean).toBe(0);
    expect(result?.stddev).toBe(0);
  });
});
