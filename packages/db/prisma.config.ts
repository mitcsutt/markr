import { config } from '@dotenvx/dotenvx';
import { defineConfig, env } from 'prisma/config';

// Load .env
config({ convention: 'nextjs' });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});