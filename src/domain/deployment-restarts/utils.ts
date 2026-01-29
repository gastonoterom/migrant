import type { Deployment } from '../../config';
import type { RestartDeploymentPayload } from './types';

export const buildRestartUrl = (payload: Deployment): string => {
  const { url, application, namespace, resourceName } = payload;

  const params = new URLSearchParams({
    namespace,
    resourceName,
    version: 'v1',
    kind: 'Deployment',
    group: 'apps',
  });

  return `${url}/api/v1/applications/${application}/resource/actions?${params}`;
};

export const buildRestartPayloads = (deployments: Deployment[]): RestartDeploymentPayload[] => {
  return deployments.map((deployment) => ({
    ...deployment,
    restartUrl: buildRestartUrl(deployment),
  }));
};
