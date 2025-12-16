import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createSubmission,
  getExistingSubmissions,
  updateSubmission,
} from './submission';

vi.mock('../client', () => import('../__mocks__/client'));

import { prisma } from '../__mocks__/client';

describe('getExistingSubmissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty map for empty input', async () => {
    const result = await getExistingSubmissions([]);

    expect(prisma.submission.findMany).not.toHaveBeenCalled();
    expect(result.size).toBe(0);
  });

  it('fetches submissions with OR conditions', async () => {
    prisma.submission.findMany.mockResolvedValue([
      { id: 1, studentId: 1, testId: 1, obtained: 10, available: 20 },
    ]);

    const result = await getExistingSubmissions([
      { studentId: 1, testId: 1 },
      { studentId: 2, testId: 1 },
    ]);

    expect(prisma.submission.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { studentId: 1, testId: 1 },
          { studentId: 2, testId: 1 },
        ],
      },
    });
    expect(result.size).toBe(1);
    expect(result.get('1:1')?.id).toBe(1);
  });

  it('builds correct map keys', async () => {
    prisma.submission.findMany.mockResolvedValue([
      { id: 1, studentId: 5, testId: 10 },
      { id: 2, studentId: 7, testId: 10 },
    ]);

    const result = await getExistingSubmissions([
      { studentId: 5, testId: 10 },
      { studentId: 7, testId: 10 },
    ]);

    expect(result.get('5:10')?.id).toBe(1);
    expect(result.get('7:10')?.id).toBe(2);
  });
});

describe('createSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates submission with provided data', async () => {
    const input = {
      studentId: 1,
      testId: 1,
      obtained: 15,
      available: 20,
      scannedOn: new Date('2024-01-01'),
      rawPayload: { extra: 'data' },
    };

    prisma.submission.create.mockResolvedValue({ id: 1, ...input });

    await createSubmission(input);

    expect(prisma.submission.create).toHaveBeenCalledWith({
      data: input,
    });
  });
});

describe('updateSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates submission by id', async () => {
    prisma.submission.update.mockResolvedValue({
      id: 1,
      obtained: 18,
    });

    await updateSubmission(1, { obtained: 18 });

    expect(prisma.submission.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { obtained: 18 },
    });
  });

  it('supports partial updates', async () => {
    prisma.submission.update.mockResolvedValue({ id: 1 });

    await updateSubmission(1, { available: 25 });

    expect(prisma.submission.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { available: 25 },
    });
  });
});
