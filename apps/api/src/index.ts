import { config } from '@dotenvx/dotenvx';
import express from 'express';
import studentsController from './controllers/students';

// Load .env
config({ convention: 'nextjs' });

const app = express();

app.use(express.json());

// Routes
app.use('/students', studentsController);

app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000`),
);
