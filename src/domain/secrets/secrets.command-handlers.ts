import type { Cluster, ServiceUser } from '../../config';
import { log } from '../../utils/log';
import { createSecretsClient, updateSecret } from './secrets.services';
import { buildSecretUpdatePayloads } from './utils';

export type UpdateSecretsCommand = {
  cluster: Cluster;
  serviceUsers: ServiceUser[];
};

export const handleUpdateSecrets = async (command: UpdateSecretsCommand): Promise<void> => {
  const { cluster, serviceUsers } = command;

  const client = createSecretsClient();
  const payloads = buildSecretUpdatePayloads(cluster, serviceUsers);

  log.info(`☁️  Updating ${payloads.length} secret/s in AWS...`);

  for (const payload of payloads) {
    await updateSecret(client, payload);
  }
};
