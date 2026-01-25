import * as E from 'fp-ts/lib/Either';
import { seedRequiredError } from './errors';
import type { Environment } from './types';

export const getEnvironment = (): E.Either<Error, Environment> => {
  const seed = process.env.PASSWORD_SEED;
  // TODO: Reconsider not relying too much on timestamps due to clock skews
  const timestamp = process.env.PASSWORD_TIMESTAMP ?? String(Date.now());
  const configFile = process.env.CONFIG_FILE ?? './migrant.yaml';

  if (!seed) return E.left(seedRequiredError());

  return E.right({ seed, timestamp, configFile });
};
