import { beforeEach, describe, expect, it, vi } from 'vitest';
import { upsertStudents } from './student';

vi.mock('../client', () => import('../__mocks__/client'));

import { prisma } from '../__mocks__/client';

describe('upsertStudents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('upserts a single student and returns map', async () => {
    prisma.student.upsert.mockResolvedValue({
      id: 1,
      studentNumber: '12345',
    });

    const result = await upsertStudents([
      { studentNumber: '12345', firstName: 'Jane', lastName: 'Doe' },
    ]);

    expect(prisma.student.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.student.upsert).toHaveBeenCalledWith({
      where: { studentNumber: '12345' },
      update: { firstName: 'Jane', lastName: 'Doe' },
      create: { studentNumber: '12345', firstName: 'Jane', lastName: 'Doe' },
      select: { id: true, studentNumber: true },
    });
    expect(result.get('12345')).toEqual({ id: 1, studentNumber: '12345' });
  });

  it('deduplicates by studentNumber, keeping last occurrence', async () => {
    prisma.student.upsert.mockResolvedValue({
      id: 1,
      studentNumber: '12345',
    });

    await upsertStudents([
      { studentNumber: '12345', firstName: 'Jane', lastName: 'Doe' },
      { studentNumber: '12345', firstName: 'Janet', lastName: 'Doe' },
    ]);

    // Should only call upsert once (deduplicated)
    expect(prisma.student.upsert).toHaveBeenCalledTimes(1);
    // Should use the last occurrence's data
    expect(prisma.student.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { firstName: 'Janet', lastName: 'Doe' },
      }),
    );
  });

  it('handles multiple unique students in parallel', async () => {
    prisma.student.upsert
      .mockResolvedValueOnce({ id: 1, studentNumber: '12345' })
      .mockResolvedValueOnce({ id: 2, studentNumber: '67890' });

    const result = await upsertStudents([
      { studentNumber: '12345', firstName: 'Jane', lastName: 'Doe' },
      { studentNumber: '67890', firstName: 'John', lastName: 'Smith' },
    ]);

    expect(prisma.student.upsert).toHaveBeenCalledTimes(2);
    expect(result.size).toBe(2);
    expect(result.get('12345')?.id).toBe(1);
    expect(result.get('67890')?.id).toBe(2);
  });

  it('returns empty map for empty input', async () => {
    const result = await upsertStudents([]);

    expect(prisma.student.upsert).not.toHaveBeenCalled();
    expect(result.size).toBe(0);
  });
});
