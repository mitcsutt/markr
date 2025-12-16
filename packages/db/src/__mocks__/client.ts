import { vi } from 'vitest';

/**
 * Mock Prisma client for testing.
 * Each model has vi.fn() methods that can be configured per test.
 */
export const prisma = {
  student: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
  test: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
  submission: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  // Must actually invoke the callback for transaction tests to work
  $transaction: vi.fn((fn: () => Promise<unknown>) => fn()),
};
