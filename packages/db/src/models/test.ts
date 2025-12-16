import type { Test } from '#prisma/generated/client';
import { prisma } from '../client';

/**
 * Batch upserts tests by test ID.
 * Returns a map of testId -> test record.
 */
export async function upsertTests(
  testIds: string[],
): Promise<Map<string, Pick<Test, 'id' | 'testId'>>> {
  // Dedupe
  const unique = [...new Set(testIds)];

  // Upsert all in parallel
  const tests = await Promise.all(
    unique.map((testId) =>
      prisma.test.upsert({
        where: { testId },
        update: {},
        create: { testId },
        select: { id: true, testId: true },
      }),
    ),
  );

  // Build lookup map
  const result = new Map<string, Pick<Test, 'id' | 'testId'>>();
  for (const test of tests) {
    result.set(test.testId, test);
  }
  return result;
}
