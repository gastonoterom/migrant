import type { Cluster, ServiceUser } from '../../config';
import type { SecretUpdatePayload } from './secrets.types';

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
  serviceUsers
    .map((service) =>
      service.secrets.map((secret) => ({
        container: secret.container,
        key: secret.key,
        newValue: buildDatabaseUrl(cluster, service, secret.databaseName),
      }))
    )
    .flat();
