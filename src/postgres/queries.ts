import * as TE from 'fp-ts/lib/TaskEither';

import { pipe } from 'fp-ts/lib/function';
import postgres from 'postgres';
import type { Config, Service } from '../config';
import { consoleLog, returnVoid, traverseTaskEither, withContext } from '../fp-core';
import type { PostgresUser } from './types';
import { escapePassword } from './utils';

const createPostgresClient = (config: Config) => {
  const { host, port, admin_user: username, admin_password: password } = config;

  return postgres({
    host,
    port,
    database: 'postgres',
    username,
    password,
    connect_timeout: 10,
    idle_timeout: 10,
    max_lifetime: 60,
  });
};

const createUser = (
  sql: postgres.Sql,
  { username, password }: PostgresUser
): TE.TaskEither<Error, void> =>
  TE.tryCatch(
    async () => {
      // TODO: Revisit safety
      const fullUsername = `${username}`;
      const escapedPassword = escapePassword(password);

      await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${fullUsername}') THEN
          CREATE USER "${fullUsername}" WITH PASSWORD '${escapedPassword}';
        ELSE
          ALTER USER "${fullUsername}" WITH PASSWORD '${escapedPassword}';
        END IF;
      END
      $$;
    `);
    },
    withContext(`Failed to create postgres user: ${username}`)
  );

const grantAccessToDatabase = (sql: postgres.Sql, { username }: PostgresUser, database: string) =>
  TE.tryCatch(
    async () =>
      sql.begin('isolation level serializable', async (tx) => {
        // TODO: Revisit safety
        await tx.unsafe(`GRANT CONNECT ON DATABASE "${database}" TO "${username}"`);
        await tx.unsafe(`GRANT USAGE, CREATE ON SCHEMA public TO "${username}"`);
        await tx.unsafe(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "${username}"`);
        await tx.unsafe(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "${username}"`);
        await tx.unsafe(`GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO "${username}"`);
      }),
    withContext(`Failed to grant access to database: ${database}`)
  );

const grantAccessToDatabases = (sql: postgres.Sql, user: PostgresUser, databases: string[]) => {
  const grantAccess = (database: string) =>
    pipe(
      consoleLog(`   🔑 Granting access to database: ${database}`),
      TE.flatMap(() => grantAccessToDatabase(sql, user, database))
    );

  return traverseTaskEither(grantAccess)(databases);
};

const createPostgresUser =
  (sql: postgres.Sql) =>
  (service: Service): TE.TaskEither<Error, void> => {
    const { postgres_user: username, postgres_password: password, databases } = service;
    const user = { username, password };

    return pipe(
      consoleLog(`👤 Creating user: ${user.username}`),
      TE.flatMap(() => createUser(sql, user)),
      TE.flatMap(() => grantAccessToDatabases(sql, user, databases)),
      returnVoid
    );
  };

export const createPostgresUsers = (config: Config): TE.TaskEither<Error, void> =>
  pipe(
    createPostgresClient(config),
    (sql) => traverseTaskEither(createPostgresUser(sql))(config.services),
    returnVoid
  );
