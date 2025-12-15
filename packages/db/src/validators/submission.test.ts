import { describe, expect, it } from 'vitest';
import { TestResultBatchSchema, TestResultSchema } from './submission';

describe('TestResultSchema', () => {
  const validResult = {
    firstName: 'Jane',
    lastName: 'Doe',
    studentNumber: '12345',
    testId: 'test-001',
    obtained: 15,
    available: 20,
    scannedOn: new Date('2024-01-01T10:00:00Z'),
  };

  it('accepts a valid test result', () => {
    const result = TestResultSchema.safeParse(validResult);
    expect(result.success).toBe(true);
  });

  describe('firstName', () => {
    it('rejects empty string', () => {
      const result = TestResultSchema.safeParse({
        ...validResult,
        firstName: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('lastName', () => {
    it('rejects empty string', () => {
      const result = TestResultSchema.safeParse({
        ...validResult,
        lastName: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('studentNumber', () => {
    it('rejects empty string', () => {
      const result = TestResultSchema.safeParse({
        ...validResult,
        studentNumber: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('testId', () => {
    it('rejects empty string', () => {
      const result = TestResultSchema.safeParse({
        ...validResult,
        testId: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('obtained', () => {
    it('rejects negative value', () => {
      const result = TestResultSchema.safeParse({
        ...validResult,
        obtained: -1,
      });
      expect(result.success).toBe(false);
    });

    it('accepts zero', () => {
      const result = TestResultSchema.safeParse({
        ...validResult,
        obtained: 0,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('available', () => {
    it('rejects zero', () => {
      const result = TestResultSchema.safeParse({
        ...validResult,
        available: 0,
      });
      expect(result.success).toBe(false);
    });

    it('requires at least 1', () => {
      const result = TestResultSchema.safeParse({
        ...validResult,
        available: 1,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('scannedOn', () => {
    it('coerces string to Date object', () => {
      const result = TestResultSchema.safeParse({
        ...validResult,
        scannedOn: '2024-01-01T10:00:00Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scannedOn).toBeInstanceOf(Date);
      }
    });

    it('accepts Date object', () => {
      const result = TestResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scannedOn).toBeInstanceOf(Date);
      }
    });
  });

  describe('rawPayload', () => {
    it('is optional', () => {
      const result = TestResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });

    it('accepts object', () => {
      const result = TestResultSchema.safeParse({
        ...validResult,
        rawPayload: { extra: 'data' },
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('TestResultBatchSchema', () => {
  const validResult = {
    firstName: 'Jane',
    lastName: 'Doe',
    studentNumber: '12345',
    testId: 'test-001',
    obtained: 15,
    available: 20,
    scannedOn: new Date('2024-01-01T10:00:00Z'),
  };

  it('accepts array with one result', () => {
    const result = TestResultBatchSchema.safeParse([validResult]);
    expect(result.success).toBe(true);
  });

  it('accepts array with multiple results', () => {
    const result = TestResultBatchSchema.safeParse([
      validResult,
      { ...validResult, studentNumber: '12346' },
    ]);
    expect(result.success).toBe(true);
  });

  it('rejects empty array', () => {
    const result = TestResultBatchSchema.safeParse([]);
    expect(result.success).toBe(false);
  });

  it('rejects if any result is invalid', () => {
    const result = TestResultBatchSchema.safeParse([
      validResult,
      { ...validResult, firstName: '' },
    ]);
    expect(result.success).toBe(false);
  });
});
