import * as A from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/function';
import type { Cluster, ServiceUser } from '../../config';
import type { SecretUpdatePayload } from './types';

export const buildDatabaseUrl = (cluster: Cluster, serviceUser: ServiceUser, database: string) => {
  const { host, port } = cluster;
  const { username, password } = serviceUser;

  const encodedPassword = encodeURIComponent(password);

  return `postgresql://${username}:${encodedPassword}@${host}:${port}/${database}`;
};

export const buildSecretUpdatePayloads = (
  cluster: Cluster,
  serviceUsers: ServiceUser[]
): SecretUpdatePayload[] =>
  pipe(
    serviceUsers.map((service) =>
      service.secrets.map((secret) => ({
        container: secret.container,
        key: secret.key,
        newValue: buildDatabaseUrl(cluster, service, secret.databaseName),
      }))
    ),
    A.flatten
  );
