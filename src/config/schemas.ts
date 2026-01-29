import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import { z } from 'zod';
import { derivePassword } from '../utils/crypto';
import { withContext } from '../utils/fp-core';
import { getEnvironment } from './environment';
import type {
  Cluster,
  Config,
  Database,
  Deployment,
  Environment,
  Secret,
  ServiceUser,
} from './types';

const ClusterSchema = z.object({
  host: z.string(),
  port: z.number(),
  admin_user: z.string(),
  admin_password: z.string().default(''),
});

export type ClusterSchema = z.infer<typeof ClusterSchema>;

const DeploymentSchema = z.object({
  url: z.string(),
  application: z.string(),
  namespace: z.string(),
  resource_name: z.string(),
});

export type DeploymentSchema = z.infer<typeof DeploymentSchema>;

const SecretSchema = z.object({
  container: z.string(),
  key: z.string(),
  type: z.string(),
  database_name: z.string(),
});

export type SecretSchema = z.infer<typeof SecretSchema>;

const DatabaseSchema = z.object({
  name: z.string(),
  schemas: z.array(z.string()),
});

export type DatabaseSchema = z.infer<typeof DatabaseSchema>;

const ServiceUserSchema = z.object({
  username_prefix: z.string(),
  databases: z.array(DatabaseSchema),
  secrets: z.array(SecretSchema),
  deployments: z.array(DeploymentSchema),
});

export type ServiceUserSchema = z.infer<typeof ServiceUserSchema>;

const ConfigSchema = z.object({
  client: z.string(),
  cluster: ClusterSchema,
  service_users: z.array(ServiceUserSchema),
});

export type ConfigSchema = z.infer<typeof ConfigSchema>;

const toCluster = (schema: ClusterSchema): Cluster => ({
  host: schema.host,
  port: schema.port,
  adminUsername: schema.admin_user,
  adminPassword: schema.admin_password,
});

const toDeployment = (schema: DeploymentSchema): Deployment => ({
  url: schema.url,
  application: schema.application,
  namespace: schema.namespace,
  resourceName: schema.resource_name,
});

const toSecret = (schema: SecretSchema): Secret => ({
  type: 'DATABASE_URL',
  container: schema.container,
  key: schema.key,
  databaseName: schema.database_name,
});

const toDatabase = (schema: DatabaseSchema): Database => ({
  schemas: schema.schemas,
  name: schema.name,
});

const getUsername = (prefix: string, timestamp: string) => `${prefix}_${timestamp}`;

export const toServiceUser =
  ({ timestamp, seed }: Environment) =>
  (schema: ServiceUserSchema): ServiceUser => ({
    username: getUsername(schema.username_prefix, timestamp),
    password: derivePassword({
      seed,
      timestamp,
      identifier: getUsername(schema.username_prefix, timestamp),
    }),
    databases: schema.databases.map(toDatabase),
    secrets: schema.secrets.map(toSecret),
    deployments: schema.deployments.map(toDeployment),
  });

export const toConfig =
  (environment: Environment) =>
  (schema: ConfigSchema): Config => ({
    client: schema.client,
    cluster: toCluster(schema.cluster),
    environment,
    serviceUsers: schema.service_users.map(toServiceUser(environment)),
  });

const readFileAsync = (path: string) =>
  TE.tryCatch(() => readFile(path, 'utf-8'), withContext(`Failed to read config file: ${path}`));

const parseYaml = (content: string): E.Either<Error, unknown> =>
  E.tryCatch(() => parse(content), withContext('Failed to parse YAML config'));

const parseConfigSchema = (content: unknown): E.Either<Error, ConfigSchema> =>
  pipe(ConfigSchema.safeParse(content), (result) =>
    result.success ? E.right(result.data) : E.left(result.error)
  );

const buildConfigFromSchemas = (environment: Environment): TE.TaskEither<Error, Config> =>
  pipe(
    environment.configFile,
    readFileAsync,
    TE.flatMapEither(parseYaml),
    TE.flatMapEither(parseConfigSchema),
    TE.map(toConfig(environment))
  );

export const buildConfig = pipe(
  TE.fromEither(getEnvironment()),
  TE.flatMap(buildConfigFromSchemas)
);
