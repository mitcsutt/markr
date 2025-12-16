import { config } from '@dotenvx/dotenvx';
import express from 'express';
import routes from './routes';

// Load .env
config({ convention: 'nextjs' });

const app = express();

// Parse JSON bodies
app.use(express.json());

// Parse XML bodies for the import endpoint
// Increased limit for large batch imports (sample file is ~150KB)
app.use(express.text({ type: 'text/xml+markr', limit: '1mb' }));

// Routes
app.use(routes);

app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000`),
);
