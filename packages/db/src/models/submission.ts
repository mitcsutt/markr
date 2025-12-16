import type { Prisma, Submission } from '#prisma/generated/client';
import { prisma } from '../client';

/**
 * Fetches existing submissions for the given student+test pairs.
 * Returns a map keyed by "studentId:testId".
 */
export async function getExistingSubmissions(
  keys: Prisma.SubmissionWhereInput[],
): Promise<Map<string, Submission>> {
  if (keys.length === 0) return new Map();

  // Build OR conditions for all keys
  const submissions = await prisma.submission.findMany({
    where: {
      OR: keys.map((k) => ({
        studentId: k.studentId,
        testId: k.testId,
      })),
    },
  });

  const result = new Map<string, Submission>();
  for (const sub of submissions) {
    result.set(`${sub.studentId}:${sub.testId}`, sub);
  }
  return result;
}

/**
 * Creates a new submission.
 */
export async function createSubmission(
  input: Prisma.SubmissionUncheckedCreateInput,
) {
  return prisma.submission.create({
    data: input,
  });
}

/**
 * Updates an existing submission (for higher score or available marks).
 */
export async function updateSubmission(
  id: number,
  data: Partial<
    Omit<Prisma.SubmissionUncheckedCreateInput, 'studentId' | 'testId'>
  >,
) {
  return prisma.submission.update({
    where: { id },
    data,
  });
}
