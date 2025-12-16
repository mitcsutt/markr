import type { Prisma, Submission } from '#prisma/generated/client';
import { prisma } from '../client';
import { upsertStudents } from '../models/student';
import {
  createSubmission,
  getExistingSubmissions,
  updateSubmission,
} from '../models/submission';
import { upsertTests } from '../models/test';
import type { TestResult } from '../validators/submission';

type SubmissionKey = Pick<
  Prisma.SubmissionUncheckedCreateInput,
  'studentId' | 'testId'
>;

/**
 * Creates a new submission for a student+test that doesn't exist yet.
 */
async function handleNewSubmission(
  key: SubmissionKey,
  result: TestResult,
): Promise<Submission> {
  return createSubmission({
    studentId: key.studentId,
    testId: key.testId,
    obtained: result.obtained,
    available: result.available,
    scannedOn: result.scannedOn,
    rawPayload: (result.rawPayload ?? {}) as Prisma.InputJsonValue,
  });
}

/**
 * Updates an existing submission when the new score is higher.
 */
async function handleHigherScore(
  existing: Submission,
  result: TestResult,
): Promise<Submission> {
  return updateSubmission(existing.id, {
    obtained: result.obtained,
    available: Math.max(result.available, existing.available),
    scannedOn: result.scannedOn,
    rawPayload: (result.rawPayload ?? {}) as Prisma.InputJsonValue,
  });
}

/**
 * Updates an existing submission when only the available marks are higher.
 */
async function handleHigherAvailable(
  existing: Submission,
  result: TestResult,
): Promise<Submission> {
  return updateSubmission(existing.id, {
    available: result.available,
  });
}

/**
 * Determines what action to take for a result and returns the submission.
 */
async function processResult(
  key: SubmissionKey,
  result: TestResult,
  existing: Submission | undefined,
): Promise<Submission> {
  if (!existing) {
    return handleNewSubmission(key, result);
  }

  if (result.obtained > existing.obtained) {
    return handleHigherScore(existing, result);
  }

  if (result.available > existing.available) {
    return handleHigherAvailable(existing, result);
  }

  return existing;
}

/**
 * Imports a batch of test results in a single transaction.
 * Optimized to minimize database queries:
 * 1. Batch upsert all unique students
 * 2. Batch upsert all unique tests
 * 3. Batch fetch all existing submissions
 * 4. Create/update submissions as needed
 */
export async function importTestResults(results: TestResult[]) {
  // https://www.prisma.io/docs/orm/prisma-client/queries/transactions
  return prisma.$transaction(async () => {
    // 1. Batch upsert students
    const studentInputs: Prisma.StudentCreateInput[] = results.map((r) => ({
      studentNumber: r.studentNumber,
      firstName: r.firstName,
      lastName: r.lastName,
    }));
    const studentMap = await upsertStudents(studentInputs);

    // 2. Batch upsert tests
    const testIds = results.map((r) => r.testId);
    const testMap = await upsertTests(testIds);

    // 3. Build keys and fetch existing submissions
    const keys: SubmissionKey[] = results.map((r) => ({
      studentId: studentMap.get(r.studentNumber)!.id,
      testId: testMap.get(r.testId)!.id,
    }));
    const existingMap = await getExistingSubmissions(keys);

    // 4. Process each result
    const zipped = results.map((result, i) => ({ result, key: keys[i]! }));
    const submissions: Submission[] = [];

    for (const { result, key } of zipped) {
      const mapKey = `${key.studentId}:${key.testId}`;
      const existing = existingMap.get(mapKey);

      const submission = await processResult(key, result, existing);
      submissions.push(submission);

      // Track for potential duplicates within same batch
      existingMap.set(mapKey, submission);
    }

    return submissions;
  });
}
