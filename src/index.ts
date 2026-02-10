#!/usr/bin/env bun
import 'dotenv/config';

import { Command } from 'commander';
import { buildConfig, type Config } from './config';
import { handleCreateDbAccess } from './domain/databases';
import { handleRestartDeployments } from './domain/deployment-restarts';
import { handleUpdateSecrets } from './domain/secrets';
import { log } from './utils/log';

const runCommand =
  (handlerFn: (config: Config) => Promise<void>) =>
  async (configFile: string): Promise<void> => {
    try {
      const config = await buildConfig(configFile);

      log.info(`🚀 Booting up, timestamp: ${config.environment.timestamp}`);
      log.info(`📄 Reading config from: ${config.environment.configFile}`);

      await handlerFn(config);

      log.success('✅ Done!');
      process.exit(0);
    } catch (error) {
      log.error('❌ Error:', error);

      if (error instanceof Error && error.stack) log.error(error.stack);

      process.exit(1);
    }
  };

const runUpdateAll = runCommand(async (config: Config) => {
  await handleCreateDbAccess({ cluster: config.cluster, serviceUsers: config.serviceUsers });

  await handleUpdateSecrets({ cluster: config.cluster, serviceUsers: config.serviceUsers });

  await handleRestartDeployments({
    environment: config.environment,
    serviceUsers: config.serviceUsers,
  });
});

const runCreateDbAccess = runCommand((config: Config) =>
  handleCreateDbAccess({ cluster: config.cluster, serviceUsers: config.serviceUsers })
);

const runUpdateSecrets = runCommand((config: Config) =>
  handleUpdateSecrets({ cluster: config.cluster, serviceUsers: config.serviceUsers })
);

const runRestartDeployments = runCommand((config: Config) =>
  handleRestartDeployments({ environment: config.environment, serviceUsers: config.serviceUsers })
);

const program = new Command();

program
  .name('migrant')
  .description('Database migration and secrets management CLI')
  .version('1.0.0')
  .option('-c, --config <path>', 'Config file path', './migrant.yaml');

program
  .command('update-all', { isDefault: true })
  .description('Run all operations: create db access, update secrets, restart services')
  .action(() => runUpdateAll(program.opts().config));

program
  .command('create-db-access')
  .description('Create database access for service users (i.e. Postgres)')
  .action(() => runCreateDbAccess(program.opts().config));

program
  .command('update-secrets')
  .description('Update secrets with new credentials (i.e. AWS Secrets)')
  .action(() => runUpdateSecrets(program.opts().config));

program
  .command('restart-deployments')
  .description('Restart service deployments (i.e. ArgoCD)')
  .action(() => runRestartDeployments(program.opts().config));

program.parse();
