# @repo/eslint-config

Shared ESLint configuration for the Markr monorepo.

## Overview

Provides consistent linting rules across all packages and applications, ensuring code quality and style consistency throughout the codebase.

## Usage

In your package's `eslint.config.js`:

```javascript
import baseConfig from '@repo/eslint-config/base';

export default [...baseConfig];
```
