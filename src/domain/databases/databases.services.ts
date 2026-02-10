import postgres from 'postgres';
import type { ServiceUser } from '../../config';
import { log } from '../../utils/log';
import { validateCredentials } from './databases.utils';

// TODO: Allow readonly permissions
const createPostgresUser = async (
  sql: postgres.Sql,
  { username, password }: { username: string; password: string }
): Promise<void> => {
  try {
    await sql.begin('isolation level serializable', async (_tx) => {
      const tx = _tx as unknown as postgres.Sql;

      const exists = await tx`SELECT 1 FROM pg_roles WHERE rolname = ${username}`;

      if (exists.length === 0) {
        await tx.unsafe(`CREATE USER "${username}" WITH PASSWORD '${password}'`);
        await tx.unsafe(`GRANT rds_superuser TO "${username}"`);
      } else {
        await tx.unsafe(`ALTER USER "${username}" WITH PASSWORD '${password}'`);
        await tx.unsafe(`GRANT rds_superuser TO "${username}"`);
      }
    });
  } catch (err) {
    throw new Error(`Failed to create postgres user: ${username}`, { cause: err });
  }
};

export const createUser = async (sql: postgres.Sql, service: ServiceUser): Promise<void> => {
  const { username, password } = service;

  log.info(`👤 Creating user: ${username}`);

  validateCredentials(username, password);

  await createPostgresUser(sql, { username, password });
};
