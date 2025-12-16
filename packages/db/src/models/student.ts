import type { Prisma, Student } from '#prisma/generated/client';
import { prisma } from '../client';

/**
 * Batch upserts students by student number.
 * Returns a map of studentNumber -> student record.
 */
export async function upsertStudents(
  inputs: Prisma.StudentCreateInput[],
): Promise<Map<string, Pick<Student, 'id' | 'studentNumber'>>> {
  // Dedupe by studentNumber (keep last occurrence for name updates)
  const uniqueMap = new Map<string, Prisma.StudentCreateInput>();
  for (const input of inputs) {
    uniqueMap.set(input.studentNumber, input);
  }
  const unique = Array.from(uniqueMap.values());

  // Upsert all in parallel
  const students = await Promise.all(
    unique.map((input) =>
      prisma.student.upsert({
        where: { studentNumber: input.studentNumber },
        update: { firstName: input.firstName, lastName: input.lastName },
        create: input,
        select: { id: true, studentNumber: true },
      }),
    ),
  );

  // Build lookup map
  const result = new Map<string, Pick<Student, 'id' | 'studentNumber'>>();
  for (const student of students) {
    result.set(student.studentNumber, student);
  }
  return result;
}
