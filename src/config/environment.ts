import * as E from 'fp-ts/lib/Either';
import {
  argoCdTokenRequiredError,
  clusterPasswordRequiredError,
  seedRequiredError,
} from './errors';
import type { Environment } from './types';

export const getEnvironment = (): E.Either<Error, Environment> => {
  const seed = process.env.PASSWORD_SEED;

  // TODO: Reconsider not relying too much on timestamps due to clock skews
  const timestamp = process.env.PASSWORD_TIMESTAMP ?? String(Date.now());
  const configFile = process.env.CONFIG_FILE ?? './migrant.yaml';
  const argoCdToken = process.env.ARGOCD_TOKEN;
  const clusterPassword = process.env.CLUSTER_PASSWORD;

  if (!seed) return E.left(seedRequiredError());
  if (!clusterPassword) return E.left(clusterPasswordRequiredError());
  if (!argoCdToken) return E.left(argoCdTokenRequiredError());

  return E.right({ seed, timestamp, configFile, argoCdToken, clusterPassword });
};
