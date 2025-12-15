import { prisma } from '../client';

/**
 * Retrieves all students from the database.
 */
export async function getStudents() {
  return prisma.student.findMany();
}
