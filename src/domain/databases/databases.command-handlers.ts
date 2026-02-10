import postgres from 'postgres';
import type { Cluster, ServiceUser } from '../../config';
import { createUser } from './databases.services';

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

const closeDbClient = async (sql: postgres.Sql): Promise<void> => {
  try {
    await sql.end();
  } catch (err) {
    throw new Error('Error closing postgres SQL connection', { cause: err });
  }
};

export type CreateDbAccessCommand = {
  cluster: Cluster;
  serviceUsers: ServiceUser[];
};

export const handleCreateDbAccess = async (command: CreateDbAccessCommand): Promise<void> => {
  const { cluster, serviceUsers } = command;

  const dbClient = createDbClient(cluster);

  try {
    for (const serviceUser of serviceUsers) {
      await createUser(dbClient, serviceUser);
    }
  } finally {
    await closeDbClient(dbClient);
  }
};
