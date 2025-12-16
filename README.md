# Markr

Test results ingestion and analytics microservice.

## Quick Start

```bash
pnpm install
pnpm dev        # Starts Postgres, generates schema, runs migrations, starts API
```

### Other Commands

```bash
pnpm db:migrate # Create a new migration (dev only)
pnpm db:seed    # Seed the database
pnpm db:reset   # Nuke and rebuild the database
```

## Design Decisions

### Monorepo (Turborepo)

Separate `apps/api` and `packages/db` packages. The DB layer doesn't export Prisma directly — only encapsulated functions like `importTestResults` and `getTestAggregate`. This makes it easier to swap either piece independently (Express for Fastify, Prisma for Drizzle, etc).

Turborepo gives us free build caching locally, with self-hosted remote caching available if needed. Room to grow too — a web frontend could be added and share TS types directly.

### PostgreSQL + Prisma

PostgreSQL for ACID compliance, JSON column support, and wide deployment options — not locked to any cloud vendor. Prisma for auto-generated types, migrations (with rollback support and framework-agnostic history), and excellent Postgres integration.

### Database schema assumptions

- `studentNumber` is unique system-wide (assumed from the XML structure)
- `testId` is unique system-wide (same assumption)
- Every table has its own internal auto-increment `id` as the primary key, even though business keys (`studentNumber`, `testId`) are already unique. This makes future schema changes and relationships easier to manage — foreign keys reference stable internal IDs, not business identifiers that could theoretically change.

### Zod validation

Input is validated with Zod schemas before hitting the DB. This theoretically duplicates what Prisma generates, but catching bad data early avoids unnecessary DB round-trips and gives clearer error messages. If any result in a batch fails, the entire document is rejected per spec.

### XML handling

We check for the `mcq-test-results` root element to avoid accidentally processing other XML document types from the grading machines.

### Storing extra fields as JSON

The legacy machines send fields we don't need yet (individual answers, mystery reporting fields). We store them in a `rawPayload` JSON column — you can't go back in time to collect data you didn't store. When the analytics team wants per-question breakdowns, the data will already be there.

If AWS costs become a concern, we could offload raw payloads to S3 until needed.

### Same table for rawPayload

We store `rawPayload` directly on the Submission table rather than a separate table:

1. **Atomic** — One table = one insert = spec-compliant rejection of bad documents
2. **No perf hit** — PostgreSQL doesn't load JSON columns unless you SELECT them
3. **Simple** — No JOINs, the data belongs to the submission

### Handling duplicates

Papers sometimes get scanned twice (folded corners, etc). Same student + test combo keeps the highest score. The `@@unique([studentId, testId])` constraint enforces this at DB level.

Considered soft deletes to keep history of superseded submissions, but decided against it — scanner errors aren't worth logging.

### Aggregate computation

The `/results/:test-id/aggregate` endpoint computes stats on every request by fetching all submissions (O(n)). Fine for nightly batch queries; if we need real-time dashboards later, we can add caching or pre-compute on import.

**On stddev:** The spec requirements listed `mean`, `count`, `p25`, `p50`, `p75` — but the example response included `stddev`, `min`, `max`. We added all three. Better to have it and not need it.

### Test strategy

Unit tests with mocked Prisma client. Prisma itself is well-tested, so we're not re-testing SQL behavior. I'd have liked to add integration tests against a real DB but ran out of time — it's on the TODO list.

**Vitest**:

Chose Vitest over Jest for speed — it's noticeably faster, especially in watch mode. Full Jest-compatible syntax means no learning curve.

### CI/CD

Using Husky git hooks for linting and tests on push. In a team setting I'd protect `main` and require PRs, but couldn't justify the overhead solo. Felt weird pushing straight to main, but here we are.

### Ports

Spec examples use `localhost:4567` — assumed illustrative. We use standard defaults: `3000` (Express), `5432` (Postgres), `5555` (Prisma Studio).

### Prisma Studio

Included in docker-compose on port `5555` for visual DB browsing during dev. Strictly a dev tool — wouldn't be deployed to production.

### AI-assisted development

I focused on architecture: setting up the monorepo structure, defining Cursor rules for patterns, and outlining the spec in `docs/`. I detailed my thinking in `docs/solutions.md` and provided the sample XML and the original brief so the AI had clear context.

By the time it came to implementing controllers and services, the AI really thrived — the structure was there, the patterns were defined, and it could fill in the details confidently.
