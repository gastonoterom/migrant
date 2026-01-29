export type Environment = {
  seed: string;
  timestamp: string;
  configFile: string;
  argoCdToken: string;
  clusterPassword: string;
};

export type Cluster = {
  host: string;
  port: number;
  adminUsername: string;
  adminPassword: string;
};

export type Database = {
  name: string;
  schemas: string[];
};

export type Secret = {
  type: 'DATABASE_URL';
  container: string;
  key: string;
  databaseName: string;
};

export type Deployment = {
  url: string;
  application: string;
  namespace: string;
  resourceName: string;
};

export type ServiceUser = {
  username: string;
  password: string;
  databases: Database[];
  secrets: Secret[];
  deployments: Deployment[];
};

export type Config = {
  client: string;
  cluster: Cluster;
  environment: Environment;
  serviceUsers: ServiceUser[];
};
