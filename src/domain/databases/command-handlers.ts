import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import postgres from 'postgres';
import type { Cluster, ServiceUser } from '../../config';
import { traverseTE, withContext } from '../../utils/fp-core';
import { createUser } from './services';

const createDbClient = (cluster: Cluster) => {
  const { host, port, adminUsername: username, adminPassword: password } = cluster;

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

const closeDbClient = (sql: postgres.Sql) =>
  TE.tryCatch(async () => await sql.end(), withContext(`Error closing postgres SQL connection`));

export type CreateDbAccessCommand = {
  cluster: Cluster;
  serviceUsers: ServiceUser[];
};

export const handleCreateDbAccess = (
  command: CreateDbAccessCommand
): TE.TaskEither<Error, void> => {
  const { cluster, serviceUsers } = command;

  const dbClient = createDbClient(cluster);
  const createDbUser = createUser(dbClient);

  return pipe(
    traverseTE(createDbUser)(serviceUsers),
    TE.flatMap(() => closeDbClient(dbClient))
  );
};
