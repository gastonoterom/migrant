import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import { z } from 'zod';
import { derivePassword } from '../utils/crypto';
import type { Cluster, Config, Deployment, Environment, Secret, ServiceUser } from './config.types';
import { getEnvironment } from './config.utils';

const ClusterSchema = z.object({
  host: z.string(),
  port: z.number(),
  admin_user: z.string(),
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

const ServiceUserSchema = z.object({
  username_prefix: z.string(),
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

const toCluster =
  ({ clusterPassword }: Environment) =>
  (schema: ClusterSchema): Cluster => ({
    host: schema.host,
    port: schema.port,
    adminUsername: schema.admin_user,
    adminPassword: clusterPassword,
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
    secrets: schema.secrets.map(toSecret),
    deployments: schema.deployments.map(toDeployment),
  });

export const toConfig =
  (environment: Environment) =>
  (schema: ConfigSchema): Config => ({
    client: schema.client,
    cluster: toCluster(environment)(schema.cluster),
    environment,
    serviceUsers: schema.service_users.map(toServiceUser(environment)),
  });

const readFileAsync = async (path: string): Promise<string> => {
  try {
    return await readFile(path, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to read config file: ${path}`, { cause: err });
  }
};

const parseYaml = (content: string): unknown => {
  try {
    return parse(content);
  } catch (err) {
    throw new Error('Failed to parse YAML config', { cause: err });
  }
};

const parseConfigSchema = (content: unknown): ConfigSchema => {
  const result = ConfigSchema.safeParse(content);

  if (result.success) return result.data;

  throw result.error;
};

const buildConfigFromSchemas = async (environment: Environment): Promise<Config> => {
  const content = await readFileAsync(environment.configFile);

  const raw = parseYaml(content);

  const schema = parseConfigSchema(raw);

  return toConfig(environment)(schema);
};

export const buildConfig = async (configFile?: string): Promise<Config> => {
  const environment = getEnvironment(configFile);

  return buildConfigFromSchemas(environment);
};
