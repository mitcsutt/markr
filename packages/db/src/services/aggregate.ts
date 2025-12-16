import { prisma } from '../client';

export interface TestAggregate {
  mean: number;
  stddev: number;
  count: number;
  p25: number;
  p50: number;
  p75: number;
  min: number;
  max: number;
}

/**
 * Calculates the percentile value from a sorted array.
 * Uses linear interpolation between closest ranks.
 */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0]!;

  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (upper >= sorted.length) return sorted[sorted.length - 1]!;
  return sorted[lower]! * (1 - weight) + sorted[upper]! * weight;
}

/**
 * Calculates the population standard deviation.
 */
function standardDeviation(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const avgSquaredDiff =
    squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Gets aggregate statistics for a test.
 * Returns null if test doesn't exist.
 * Returns aggregate with count: 0 if test exists but has no submissions.
 */
export async function getTestAggregate(
  testId: string,
): Promise<TestAggregate | null> {
  const test = await prisma.test.findUnique({
    where: { testId },
    include: {
      submissions: {
        select: {
          obtained: true,
          available: true,
        },
      },
    },
  });

  // We query by testId, so if it doesn't exist, we return null (so error response is returned).
  if (!test) {
    return null;
  }

  // The query is still valid if no submissions are found.
  // We return an aggregate with count: 0 in this case.
  if (test.submissions.length === 0) {
    return {
      mean: 0,
      stddev: 0,
      count: 0,
      p25: 0,
      p50: 0,
      p75: 0,
      min: 0,
      max: 0,
    };
  }

  // Calculate percentage scores
  const percentages = test.submissions.map((s) =>
    s.available > 0 ? (s.obtained / s.available) * 100 : 0,
  );

  // Sort for percentile calculations
  const sorted = [...percentages].sort((a, b) => a - b);

  const sum = percentages.reduce((acc, val) => acc + val, 0);
  const mean = sum / percentages.length;
  const stddev = standardDeviation(percentages, mean);

  return {
    mean: Math.round(mean * 100) / 100,
    stddev: Math.round(stddev * 100) / 100,
    count: percentages.length,
    p25: Math.round(percentile(sorted, 25) * 100) / 100,
    p50: Math.round(percentile(sorted, 50) * 100) / 100,
    p75: Math.round(percentile(sorted, 75) * 100) / 100,
    min: Math.round(sorted[0]! * 100) / 100,
    max: Math.round(sorted[sorted.length - 1]! * 100) / 100,
  };
}
