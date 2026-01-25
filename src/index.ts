import 'dotenv/config';

import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { updateSecrets } from './aws';
import { getEnvironment, readConfig } from './config';
import { consoleLog, returnVoid } from './fp-core';
import { log } from './log';
import { createUsers } from './postgres';

const main: TE.TaskEither<Error, void> = pipe(
  getEnvironment(),
  TE.fromEither,
  TE.tap(({ timestamp }) => consoleLog(`🚀 Booting up with timestamp: ${timestamp}`)),
  TE.tap(({ configFile }) => consoleLog(`📄 Reading configuration from: ${configFile}`)),
  TE.flatMap(({ configFile }) => readConfig(configFile)),
  TE.tap((config) => consoleLog(`⚙️  Processing ${config.services.length} service/s...`)),
  TE.tap(createUsers),
  TE.tap(updateSecrets),
  // TE.tap(restartServices), - WIP
  returnVoid
);

pipe(
  await main(),
  E.fold(
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
