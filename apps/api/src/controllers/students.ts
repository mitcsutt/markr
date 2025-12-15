import * as students from '@repo/db/data/students';
import { Router, type Router as RouterType } from 'express';

const router: RouterType = Router();

router.get('/', async (req, res) => {
  const allStudents = await students.getStudents();
  res.json(allStudents);
});

export default router;
