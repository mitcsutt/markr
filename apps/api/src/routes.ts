import { Router, type Router as RouterType } from 'express';
import { handleImport } from './controllers/import';
import { handleAggregate } from './controllers/results';

const router: RouterType = Router();

// Import endpoint - ingests XML test results
router.post('/import', handleImport);

// Results endpoints
router.get('/results/:testId/aggregate', handleAggregate);

export default router;
