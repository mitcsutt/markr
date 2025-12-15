# @repo/typescript-config

Shared TypeScript configuration for the Markr monorepo.

## Overview

Provides base TypeScript compiler options that are extended by all packages and applications, ensuring consistent type checking and compilation behavior.

## Usage

In your package's `tsconfig.json`:

```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```
