import {
  argoCdTokenRequiredError,
  clusterPasswordRequiredError,
  seedRequiredError,
} from './config.errors';
import type { Environment } from './config.types';

export const getEnvironment = (cliConfigFile?: string): Environment => {
  const seed = process.env.PASSWORD_SEED;

  // TODO: Reconsider not relying too much on timestamps due to clock skews
  const timestamp = process.env.PASSWORD_TIMESTAMP ?? String(Date.now());
  const configFile = cliConfigFile ?? process.env.CONFIG_FILE ?? './migrant.yaml';
  const argoCdToken = process.env.ARGOCD_TOKEN;
  const clusterPassword = process.env.CLUSTER_PASSWORD;

  if (!seed) throw seedRequiredError();
  if (!clusterPassword) throw clusterPasswordRequiredError();
  if (!argoCdToken) throw argoCdTokenRequiredError();

  return { seed, timestamp, configFile, argoCdToken, clusterPassword };
};
