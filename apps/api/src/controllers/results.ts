import { getTestAggregate } from '@repo/db/services/aggregate';
import type { Request, Response } from 'express';
import { internalError } from '#utils/responses';

/**
 * GET /results/:testId/aggregate
 * Returns aggregate statistics for a test.
 */
export async function handleAggregate(
  req: Request<{ testId: string }>,
  res: Response,
): Promise<void> {
  const { testId } = req.params;

  try {
    const aggregate = await getTestAggregate(testId);

    if (aggregate === null) {
      res.status(404).json({
        error: 'Not Found',
        message: `Test ${testId} not found`,
      });
      return;
    }

    res.status(200).json(aggregate);
  } catch {
    internalError(res);
  }
}
