import { Router, type Router as RouterType } from 'express';
import { handleImport } from './controllers/import';

const router: RouterType = Router();

// Import endpoint - ingests XML test results
router.post('/import', handleImport);

export default router;

