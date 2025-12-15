import { config } from '@dotenvx/dotenvx';
import express from 'express';

// Load .env
config({ convention: 'nextjs' });

const app = express();

app.use(express.json());

// Routes

app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000`),
);
