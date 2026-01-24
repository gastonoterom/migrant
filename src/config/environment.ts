import * as E from 'fp-ts/lib/Either';
import { seedRequiredError, timestampRequiredError } from './errors';
import type { Environment } from './types';

export const getEnvironment = (): E.Either<Error, Environment> => {
  const seed = process.env.PASSWORD_SEED;
  const timestamp = process.env.PASSWORD_TIMESTAMP;
  const configFile = process.env.CONFIG_FILE ?? './migrant.yaml';

  if (!seed) return E.left(seedRequiredError());
  if (!timestamp) return E.left(timestampRequiredError());

  return E.right({ seed, timestamp, configFile });
};
