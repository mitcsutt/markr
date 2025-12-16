import { config } from '@dotenvx/dotenvx';
import express from 'express';
import routes from './routes';

// Load .env
config({ convention: 'nextjs' });

const app = express();

// Parse JSON bodies
app.use(express.json());

// Parse XML bodies for the import endpoint
app.use(express.text({ type: 'text/xml+markr' }));

// Routes
app.use(routes);

app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000`),
);
