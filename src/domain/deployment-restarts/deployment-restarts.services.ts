import { log } from '../../utils/log';
import type { RestartDeploymentPayload } from './deployment-restarts.types';
import { buildRestartUrl } from './deployment-restarts.utils';

const unsafePostRestart = async (token: string, payload: RestartDeploymentPayload) => {
  const response = await fetch(buildRestartUrl(payload), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: '"restart"',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
};

const postRestart = async (token: string, payload: RestartDeploymentPayload): Promise<void> => {
  try {
    await unsafePostRestart(token, payload);
  } catch (err) {
    throw new Error(`Failed to restart: ${payload.resourceName}`, { cause: err });
  }
};

export const restartDeployment = async (
  token: string,
  payload: RestartDeploymentPayload
): Promise<void> => {
  log.info(`   🔄 Restarting: ${payload.resourceName}`);
  await postRestart(token, payload);
};
