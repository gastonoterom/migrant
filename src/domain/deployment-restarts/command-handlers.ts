import * as A from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import type { Deployment } from '../../config';
import { consoleLog, returnVoid, traverseTE } from '../../utils/fp-core';
import { restartDeployment } from './services';
import { buildRestartPayloads } from './utils';

export type RestartDeploymentsCommand = {
  environment: { argoCdToken: string };
  serviceUsers: { deployments: Deployment[] }[];
};

const processCommand = ({ environment, serviceUsers }: RestartDeploymentsCommand) => ({
  token: environment.argoCdToken,
  deployments: A.flatten(serviceUsers.map((user) => user.deployments)),
});

export const handleRestartDeployments = (
  command: RestartDeploymentsCommand
): TE.TaskEither<Error, void> => {
  const { token, deployments } = processCommand(command);

  const payloads = buildRestartPayloads(deployments);

  if (payloads.length === 0) {
    return consoleLog('🔄 No ArgoCD services to restart');
  }

  const restartAll = traverseTE(restartDeployment(token))(payloads);

  return pipe(
    consoleLog(`🔄 Restarting ${payloads.length} ArgoCD service/s...`),
    TE.flatMap(() => restartAll),
    returnVoid
  );
};
