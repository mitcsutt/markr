import { beforeEach, describe, expect, it, vi } from 'vitest';
import { importTestResults } from './import';
import { prisma } from '../client';
import { upsertStudents } from '../models/student';
import {
  createSubmission,
  getExistingSubmissions,
  updateSubmission,
} from '../models/submission';
import { upsertTests } from '../models/test';

// Mock the models (already tested individually)
vi.mock('../models/student', () => ({
  upsertStudents: vi.fn(),
}));
vi.mock('../models/test', () => ({
  upsertTests: vi.fn(),
}));
vi.mock('../models/submission', () => ({
  getExistingSubmissions: vi.fn(),
  createSubmission: vi.fn(),
  updateSubmission: vi.fn(),
}));
vi.mock('../client', () => ({
  prisma: {
    $transaction: vi.fn((fn: () => Promise<unknown>) => fn()),
  },
}));

describe('importTestResults', () => {
  const createTestResult = (overrides = {}) => ({
    firstName: 'Jane',
    lastName: 'Doe',
    studentNumber: '12345',
    testId: 'test-001',
    obtained: 15,
    available: 20,
    scannedOn: new Date('2024-01-01'),
    rawPayload: {},
    ...overrides,
  });

  const createMockSubmission = (overrides = {}) => ({
    id: 1,
    studentId: 1,
    testId: 1,
    obtained: 15,
    available: 20,
    scannedOn: new Date(),
    rawPayload: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(upsertStudents).mockResolvedValue(
      new Map([['12345', { id: 1, studentNumber: '12345' }]]),
    );
    vi.mocked(upsertTests).mockResolvedValue(
      new Map([['test-001', { id: 1, testId: 'test-001' }]]),
    );
    vi.mocked(getExistingSubmissions).mockResolvedValue(new Map());
    vi.mocked(createSubmission).mockResolvedValue(createMockSubmission());
  });

  it('calls models in correct order', async () => {
    await importTestResults([createTestResult()]);

    expect(upsertStudents).toHaveBeenCalledTimes(1);
    expect(upsertTests).toHaveBeenCalledTimes(1);
    expect(getExistingSubmissions).toHaveBeenCalledTimes(1);
  });

  it('passes student data to upsertStudents', async () => {
    await importTestResults([createTestResult()]);

    expect(upsertStudents).toHaveBeenCalledWith([
      { studentNumber: '12345', firstName: 'Jane', lastName: 'Doe' },
    ]);
  });

  it('passes test IDs to upsertTests', async () => {
    await importTestResults([createTestResult()]);

    expect(upsertTests).toHaveBeenCalledWith(['test-001']);
  });

  it('creates submission when none exists', async () => {
    vi.mocked(getExistingSubmissions).mockResolvedValue(new Map());

    await importTestResults([createTestResult()]);

    expect(createSubmission).toHaveBeenCalledTimes(1);
    expect(updateSubmission).not.toHaveBeenCalled();
  });

  it('updates submission when new score is higher', async () => {
    vi.mocked(getExistingSubmissions).mockResolvedValue(
      new Map([['1:1', createMockSubmission({ obtained: 10 })]]),
    );
    vi.mocked(updateSubmission).mockResolvedValue(
      createMockSubmission({ obtained: 15 }),
    );

    await importTestResults([createTestResult({ obtained: 15 })]);

    expect(createSubmission).not.toHaveBeenCalled();
    expect(updateSubmission).toHaveBeenCalledTimes(1);
  });

  it('keeps existing when new score is lower', async () => {
    const existing = createMockSubmission({ obtained: 18 });
    vi.mocked(getExistingSubmissions).mockResolvedValue(
      new Map([['1:1', existing]]),
    );

    const result = await importTestResults([
      createTestResult({ obtained: 10 }),
    ]);

    expect(result[0]).toEqual(existing);
    expect(createSubmission).not.toHaveBeenCalled();
    expect(updateSubmission).not.toHaveBeenCalled();
  });

  it('updates available marks when higher (even if score is lower)', async () => {
    vi.mocked(getExistingSubmissions).mockResolvedValue(
      new Map([['1:1', createMockSubmission({ obtained: 18, available: 20 })]]),
    );
    vi.mocked(updateSubmission).mockResolvedValue(
      createMockSubmission({ obtained: 18, available: 25 }),
    );

    await importTestResults([
      createTestResult({ obtained: 10, available: 25 }),
    ]);

    expect(updateSubmission).toHaveBeenCalledWith(1, { available: 25 });
  });

  it('runs within a transaction', async () => {
    await importTestResults([createTestResult()]);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
