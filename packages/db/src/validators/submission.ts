import { z } from 'zod';

/**
 * Schema for a single test result from the XML.
 * Validates the parsed data before database insertion.
 */
export const TestResultSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  studentNumber: z.string().min(1, 'Student number is required'),
  testId: z.string().min(1, 'Test ID is required'),
  obtained: z.number().int().min(0, 'Obtained marks must be non-negative'),
  available: z.number().int().min(1, 'Available marks must be at least 1'),
  scannedOn: z.coerce.date(),
  rawPayload: z.record(z.unknown()).optional(),
});

export type TestResult = z.infer<typeof TestResultSchema>;

/**
 * Schema for a batch of test results.
 * Used to validate the entire import payload.
 */
export const TestResultBatchSchema = z
  .array(TestResultSchema)
  .min(1, 'At least one test result is required');

export type TestResultBatch = z.infer<typeof TestResultBatchSchema>;
