import * as A from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/function';
import type { Config, Service } from '../config';
import type { SecretUpdatePayload } from './types';

export const buildDatabaseUrl = (config: Config) => (service: Service) => (database: string) => {
  const { host, port } = config;
  const { postgres_user, postgres_password } = service;

  const encodedPassword = encodeURIComponent(postgres_password);

  return `postgresql://${postgres_user}:${encodedPassword}@${host}:${port}/${database}`;
};

export const buildSecretUpdatePayloads = (config: Config): SecretUpdatePayload[] =>
  pipe(
    config.services.map((service) =>
      service.secrets.map((secret) => ({
        container: secret.container,
        key: secret.key,
        newValue: buildDatabaseUrl(config)(service)(secret.database_name),
      }))
    ),
    A.flatten
  );
