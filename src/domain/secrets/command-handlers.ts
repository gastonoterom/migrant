import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import type { Cluster, ServiceUser } from '../../config';
import { consoleLog, returnVoid, traverseTE } from '../../utils/fp-core';
import { createSecretsClient, updateSecret } from './services';
import { buildSecretUpdatePayloads } from './utils';

export type UpdateSecretsCommand = {
  cluster: Cluster;
  serviceUsers: ServiceUser[];
};

export const handleUpdateSecrets = (command: UpdateSecretsCommand): TE.TaskEither<Error, void> => {
  const { cluster, serviceUsers } = command;

  const client = createSecretsClient();
  const payloads = buildSecretUpdatePayloads(cluster, serviceUsers);

  const updateAwsSecrets = traverseTE(updateSecret(client))(payloads);

  return pipe(
    consoleLog(`☁️  Updating ${payloads.length} secret/s in AWS...`),
    TE.flatMap(() => updateAwsSecrets),
    returnVoid
  );
};
