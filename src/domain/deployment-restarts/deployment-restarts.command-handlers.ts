import type { Deployment } from '../../config';
import { log } from '../../utils/log';
import { restartDeployment } from './deployment-restarts.services';
import { buildRestartPayloads } from './deployment-restarts.utils';

export type RestartDeploymentsCommand = {
  environment: { argoCdToken: string };
  serviceUsers: { deployments: Deployment[] }[];
};

const processCommand = ({ environment, serviceUsers }: RestartDeploymentsCommand) => ({
  token: environment.argoCdToken,
  deployments: serviceUsers.map((user) => user.deployments).flat(),
});

export const handleRestartDeployments = async (
  command: RestartDeploymentsCommand
): Promise<void> => {
  const { token, deployments } = processCommand(command);

  const payloads = buildRestartPayloads(deployments);

  if (payloads.length === 0) {
    log.info('🔄 No ArgoCD services to restart');
    return;
  }

  log.info(`🔄 Restarting ${payloads.length} ArgoCD service/s...`);

  for (const payload of payloads) {
    await restartDeployment(token, payload);
  }
};
