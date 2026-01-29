import 'dotenv/config';

import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { buildConfig } from './config';
import { handleCreateDbAccess } from './domain/databases';
import { handleRestartDeployments } from './domain/deployment-restarts';
import { handleUpdateSecrets } from './domain/secrets';
import { consoleLog } from './utils/fp-core';
import { log } from './utils/log';

const main: TE.TaskEither<Error, void> = pipe(
  buildConfig,
  TE.tap(({ environment }) => consoleLog(`🚀 Booting up with timestamp: ${environment.timestamp}`)),
  TE.tap(({ environment }) => consoleLog(`📄 Reading config from: ${environment.configFile}`)),
  TE.tap(({ serviceUsers }) => consoleLog(`⚙️  Found ${serviceUsers.length} service user/s...`)),
  TE.tap((config) => handleCreateDbAccess(config)),
  TE.tap((config) => handleUpdateSecrets(config)),
  TE.tap((config) => handleRestartDeployments(config)),
  TE.fold(
    (error) => {
      log.error('❌ Error:', error);
      if (error.stack) log.error(error.stack);
      process.exit(1);
    },
    () => {
      log.success('✅ Done!');
      process.exit(0);
    }
  )
);

await main();
