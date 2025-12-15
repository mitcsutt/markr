# Markr

Markr - marking as a service. A test results ingestion and analytics microservice.

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

### Why store extra fields as JSON?

The legacy grading machines send XML with fields we don't currently need (individual answers, mystery reporting fields). Rather than throwing this data away, we store it in a `rawPayload` JSON column.

**The thinking:** You can't go back in time to collect data you didn't store. When the analytics team eventually wants per-question breakdowns, we'll already have the data sitting there ready to query.

### Why same table, not separate?

We store `rawPayload` directly on the `Submission` table rather than a separate table because:

1. **Atomic inserts** - The spec requires rejecting entire documents on validation failure. One table = one insert = naturally atomic.
2. **No performance hit** - PostgreSQL doesn't load JSON columns unless you SELECT them. Aggregate queries stay fast.
3. **Simpler** - No JOINs, no foreign key gymnastics. The data belongs to the submission, so it lives with the submission.

### Handling duplicates

Papers sometimes get scanned twice (folded corners, etc). When we see the same student + test combo, we keep the highest score. The `@@unique([studentId, testId])` constraint enforces this at the database level.

I considered using soft deletes to keep a history of superseded submissions, but decided against it. The duplicate scenario is an edge case caused by scanner issues — we care about the correct score, not a log of machine errors. Simpler is better here.
