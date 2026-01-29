import type { Deployment } from '../../config';

export type RestartDeploymentPayload = Deployment & { restartUrl: string };
