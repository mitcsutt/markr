# @repo/db

Database package for Markr, providing data access and persistence using PostgreSQL with Prisma ORM.

## Overview

This package encapsulates all database interactions. The Prisma client is internal - applications consume data through exported access functions.

## Structure

```
src/
├── client.ts      # Internal Prisma client
└── data/
    └── students.ts
```

## Usage

```typescript
import * as students from '@repo/db/data/students';
import type { Student } from '@repo/db/types';

const allStudents = await students.get_students();
```

## Development

```bash
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Run migrations
pnpm db:seed      # Seed the database
```
