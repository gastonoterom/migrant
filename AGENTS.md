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

## Functional Programming

This project uses [fp-ts](https://gcanti.github.io/fp-ts/) for functional programming patterns.

### TaskEither for Async Operations

All async operations that can fail must use `TaskEither<Error, T>`:

```typescript
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';

// Wrap async operations with error handling
const safeTask = <T>(f: () => Promise<T>) => TE.tryCatch(f, E.toError);

// Example usage
const readConfig = (path: string): TE.TaskEither<Error, Config> =>
  pipe(
    TE.tryCatch(() => readFile(path, 'utf-8'), E.toError),
    TE.map((content) => parse(content) as unknown),
    TE.flatMapEither(parseConfig)
  );
```

### Pipe for Composition

Use `pipe` for function composition:

```typescript
import { pipe } from 'fp-ts/lib/function';

const main: TE.TaskEither<Error, void> = pipe(
  readConfig(...),
  TE.tap((config) => consoleLog(`Processing ${config.services.length} service/s...`)),
  TE.flatMap(createPostgresUsers),
  returnVoid
);
```

### Sequential Traversal

When processing arrays with TaskEither, use sequential traversal to maintain order and handle errors properly:

```typescript
import * as A from 'fp-ts/lib/Array';

const traverseTaskEither = A.traverse(TE.ApplicativeSeq);

// Process items sequentially
const grantAccessToDatabases = (sql: postgres.Sql, user: PostgresUser, databases: string[]) => {
  const grantAccess = (database: string) =>
    pipe(
      consoleLog(`-- Granting access to database: ${database}`),
      TE.flatMap(() => grantAccessToDatabase(sql, user, database))
    );

  return traverseTaskEither(grantAccess)(databases);
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

- Import fp-ts modules with namespace imports:

  ```typescript
  import * as TE from 'fp-ts/lib/TaskEither';
  import * as E from 'fp-ts/lib/Either';
  import * as A from 'fp-ts/lib/Array';
  ```

- Import `pipe` directly:

  ```typescript
  import { pipe } from 'fp-ts/lib/function';
  ```

- Import from module barrel files (index.ts):
  ```typescript
  import { readConfig, Config } from './config';
  import { createPostgresUsers } from './postgres';
  ```
