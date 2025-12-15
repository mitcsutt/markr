# ******************************************************************
# BASE STAGE
# Sets up a minimal Node.js Alpine image with dependencies required
# for building and running the app. This stage is optimized for caching.
# ******************************************************************
FROM node:25-alpine3.22 AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Locking in our corepack version, as @latest might not be stable. Then installs and uses pnpm version 10.25.0
RUN npm i -g --force corepack@latest && corepack enable && corepack use pnpm@10.25.0
# Install Turbo globally (for monorepo task running). Keep version aligned with the app.
RUN pnpm install turbo@2.6.3 --global

# ******************************************************************
# PRUNER STAGE
# Responsible for separating the monorepo into a structure json and out directories, efficient for caching.
# ******************************************************************
FROM base AS pruner
WORKDIR /app
COPY . .

# turbo prune is more about extracting a single app from the monorepo.
RUN turbo prune @repo/api --docker


# ******************************************************************
# MAIN STAGE
# Built on the base image, this stage uses the prune values to separate the
# docker layers into efficient cache layers.
# ******************************************************************
FROM base AS main
WORKDIR /app

# Copy just the lockfile and workspace file
COPY --from=pruner /app/out/json/pnpm*.yaml /app

# pnpm fetch only requires the lockfile and workspace file, so utilising it improves caching as things
# such as scripts, imports, exports and other attributes of package.json do not affect the install cache.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
	pnpm fetch

# Now copy the package.json files which is needed for the install step.
COPY --from=pruner /app/out/json/ .

# Install dependencies from the pnpm store offline, and don't run the postinstall scripts.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
	pnpm install --offline

# Finally copy the app source code from the full pruned directory.
COPY --from=pruner /app/out/full/ .

CMD ["sh", "-c", "turbo run dev --filter=@repo/api"]