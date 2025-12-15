# @repo/api

Express-based REST API for the Markr test results ingestion service.

## Overview

This application provides HTTP endpoints for:

- Importing MCQ test results from legacy grading machines
- Querying aggregate statistics for test performance analysis

## Structure

```
src/
├── index.ts         # App setup and route mounting
└── controllers/
    └── students.ts  # Student routes
```

## Endpoints

| Method | Path                          | Description                         |
| ------ | ----------------------------- | ----------------------------------- |
| POST   | `/import`                     | Ingest XML test results             |
| GET    | `/results/:test-id/aggregate` | Get aggregate statistics for a test |

## Development

```bash
pnpm dev    # Start development server
pnpm build  # Build for production
```

## Environment Variables

| Variable       | Description                  |
| -------------- | ---------------------------- |
| `DATABASE_URL` | PostgreSQL connection string |
