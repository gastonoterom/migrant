import * as TE from 'fp-ts/lib/TaskEither';

import { pipe } from 'fp-ts/lib/function';
import postgres from 'postgres';
import type { Config, Service } from '../config';
import { consoleLog, returnVoid, traverseTaskEither, withContext } from '../fp-core';
import type { PostgresUser } from './types';
import { validateCredentials } from './utils';

const createClient = (config: Config) => {
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

const createPostgresUser = (
  sql: postgres.Sql,
  { username, password }: PostgresUser,
  databases: string[]
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
        for (const database of databases) {
          await tx`GRANT CONNECT ON DATABASE ${sql(database)} TO ${sql(username)}`;
          await tx`GRANT USAGE, CREATE ON SCHEMA public TO ${sql(username)}`;
          await tx`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${sql(username)}`;
          await tx`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${sql(username)}`;
          await tx`GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO ${sql(username)}`;
        }
      }),
    withContext(`Failed to create postgres user: ${username}`)
  );

const createUser =
  (sql: postgres.Sql) =>
  (service: Service): TE.TaskEither<Error, void> => {
    const { postgres_user: username, postgres_password: password, databases } = service;
    const user = { username, password };

    return pipe(
      consoleLog(`👤 Creating user: ${user.username}`),
      TE.flatMapEither(() => validateCredentials(username, password)),
      TE.flatMap(() => createPostgresUser(sql, user, databases)),
      returnVoid
    );
  };

export const createUsers = (config: Config): TE.TaskEither<Error, void> =>
  pipe(
    createClient(config),
    (sql) => traverseTaskEither(createUser(sql))(config.services),
    returnVoid
  );
