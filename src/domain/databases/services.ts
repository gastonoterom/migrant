import * as TE from 'fp-ts/lib/TaskEither';

import { pipe } from 'fp-ts/lib/function';
import postgres from 'postgres';
import type { Database, ServiceUser } from '../../config';
import { consoleLog, returnVoid, withContext } from '../../utils/fp-core';
import { validateCredentials } from './utils';

const createPostgresUser = (
  sql: postgres.Sql,
  { username, password }: { username: string; password: string },
  databases: Database[]
): TE.TaskEither<Error, void> =>
  TE.tryCatch(
    async () =>
      sql.begin('isolation level serializable', async (_tx) => {
        const tx = _tx as unknown as postgres.Sql;

        const exists = await tx`SELECT 1 FROM pg_roles WHERE rolname = ${username}`;

        if (exists.length === 0) {
          await tx.unsafe(`CREATE USER "${username}" WITH PASSWORD '${password}'`);
        } else {
          await tx.unsafe(`ALTER USER "${username}" WITH PASSWORD '${password}'`);
        }

        // TODO: what about schemas?

        for (const database of databases) {
          await tx`GRANT CONNECT ON DATABASE ${sql(database.name)} TO ${sql(username)}`;
          await tx`GRANT USAGE, CREATE ON SCHEMA public TO ${sql(username)}`;
          await tx`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${sql(username)}`;
          await tx`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${sql(username)}`;
          await tx`GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO ${sql(username)}`;
        }

        // TODO: investigate race conditions, schema ownership, user ownership, etc..
      }),
    withContext(`Failed to create postgres user: ${username}`)
  );

export const createUser =
  (sql: postgres.Sql) =>
  (service: ServiceUser): TE.TaskEither<Error, void> => {
    const { username, password, databases } = service;

    return pipe(
      consoleLog(`👤 Creating user: ${username}`),
      TE.flatMapEither(() => validateCredentials(username, password)),
      TE.flatMap(() => createPostgresUser(sql, { username, password }, databases)),
      returnVoid
    );
  };
