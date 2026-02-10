# Code Architecture Guide

This document describes the coding conventions and patterns used in this project for AI agents and contributors.

## Strict Typing

- TypeScript strict mode is enabled (`"strict": true` in tsconfig.json)
- Use the `type` keyword for all type definitions — **no interfaces or classes**
- Use Zod schemas for runtime validation when needed (like reading the config.yaml file)

```typescript
// Good
type PostgresUser = {
  username: string;
  password: string;
};

// Bad - don't use interfaces
interface PostgresUser {
  username: string;
  password: string;
}

// Bad - don't use classes
class PostgresUser {
  constructor(
    public username: string,
    public password: string
  ) {}
}
```

## Async Operations and Error Handling

Use plain async/await. Async functions that can fail throw errors; callers use try/catch.

- Prefer **arrow functions** for all function definitions.
- Use `Promise<T>` (or async functions returning `T`) for async work — no TaskEither.
- Use try/catch for error handling. Wrap thrown errors with context using `new Error(message, { cause: err })` when rethrowing.

```typescript
// Async operation that throws on failure
const readConfig = async (path: string): Promise<Config> => {
  try {
    const content = await readFile(path, 'utf-8');
    return parseConfig(content);
  } catch (err) {
    throw new Error(`Failed to read config: ${path}`, { cause: err });
  }
};

// Sequential processing: use for...of
const processItems = async (items: Item[]) => {
  for (const item of items) {
    await processOne(item);
  }
};
```

### No Side Effects in Utils

Utility functions should be pure — no side effects, no mutations:

```typescript
// Good - pure function
export const escapePassword = (password: string): string => {
  return password.replace(/'/g, "''");
};

// Good - pure function
export const generatePassword = (length: number = 24): string =>
  Array.from(randomBytes(length), (byte) => CHARSET[byte % CHARSET.length]).join('');
```

## Module Convention

Each module follows a strict file structure:

```
module/
├── index.ts      # Public exports only (barrel file)
├── types.ts      # Type definitions
├── utils.ts      # Pure utility functions
└── [domain].ts   # Domain logic (e.g., queries.ts, schemas.ts)
```

### index.ts — Barrel Exports

Only export public API, nothing else:

```typescript
// src/postgres/index.ts
export type { PostgresUser } from './types';
export { createPostgresUsers } from './queries';
```

### types.ts — Type Definitions

All types for the module:

```typescript
// src/postgres/types.ts
export type PostgresUser = {
  username: string;
  password: string;
};
```

### utils.ts — Pure Utilities

Helper functions with no side effects:

```typescript
// src/postgres/utils.ts
export const escapePassword = (password: string): string => {
  return password.replace(/'/g, "''");
};
```

### Domain Files — Business Logic

Additional files for domain-specific logic:

- `queries.ts` — Database queries and operations
- `schemas.ts` — Zod validation schemas

## Import Conventions

- Import from module barrel files (index.ts):
  ```typescript
  import { readConfig, Config } from './config';
  import { createPostgresUsers } from './postgres';
  ```
