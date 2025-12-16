import { importTestResults } from '@repo/db/services/import';
import { TestResultBatchSchema } from '@repo/db/validators/submission';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { MARKR_CONTENT_TYPE } from '#src/constants';
import {
  badRequest,
  internalError,
  unsupportedMediaType,
  validationError,
} from '#utils/responses';
import { parseTestResults } from '#utils/xml';

/**
 * POST /import
 * Ingests XML test results from legacy grading machines.
 */
export async function handleImport(req: Request, res: Response): Promise<void> {
  const contentType = req.headers['content-type'];
  if (contentType !== MARKR_CONTENT_TYPE) {
    unsupportedMediaType(res, MARKR_CONTENT_TYPE);
    return;
  }

  try {
    const xmlBody = req.body as string;

    if (!xmlBody || typeof xmlBody !== 'string') {
      badRequest(res, 'Request body must be XML');
      return;
    }

    const parsedResults = parseTestResults(xmlBody);
    const validation = TestResultBatchSchema.safeParse(parsedResults);

    if (!validation.success) {
      validationError(res, 'Invalid test result data', validation.error.issues);
      return;
    }

    const imported = await importTestResults(validation.data);

    res.status(200).json({
      message: 'Import successful',
      count: imported.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      validationError(res, 'Invalid test result data', error.issues);
      return;
    }

    if (error instanceof Error) {
      badRequest(res, error.message);
      return;
    }

    internalError(res);
  }
}
