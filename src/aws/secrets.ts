import {
  GetSecretValueCommand,
  PutSecretValueCommand,
  SecretsManagerClient,
  type GetSecretValueCommandOutput,
} from '@aws-sdk/client-secrets-manager';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as J from 'fp-ts/lib/Json';
import * as TE from 'fp-ts/lib/TaskEither';
import type { Config } from '../config';
import { consoleLog, returnVoid, traverseTaskEither, withContext } from '../fp-core';
import { parseJsonRecord, stringifyJson } from '../fp-core/utils';
import type { SecretUpdatePayload } from './types';
import { buildSecretUpdatePayloads } from './utils';

const createSecretsClient = (): SecretsManagerClient => new SecretsManagerClient({});

const parseGetSecretResponse = (
  response: GetSecretValueCommandOutput
): E.Either<Error, J.JsonRecord> =>
  response.SecretString ? parseJsonRecord(response.SecretString) : E.left(noSecretStringError());

const getSecretValue = (
  client: SecretsManagerClient,
  secretId: string
): TE.TaskEither<Error, J.JsonRecord> =>
  pipe(
    TE.tryCatch(
      () => client.send(new GetSecretValueCommand({ SecretId: secretId })),
      withContext(`Failed to get AWS secret: ${secretId}`)
    ),
    TE.flatMapEither(parseGetSecretResponse)
  );

const executePutSecretValue =
  (client: SecretsManagerClient, secretId: string) => (secretString: string) =>
    TE.tryCatch(
      async () => {
        await client.send(
          new PutSecretValueCommand({
            SecretId: secretId,
            SecretString: secretString,
          })
        );
      },
      withContext(`Failed to put AWS secret: ${secretId}`)
    );

const putSecretValue =
  (client: SecretsManagerClient, secretId: string) =>
  (newValue: J.JsonRecord): TE.TaskEither<Error, void> =>
    pipe(
      stringifyJson(newValue),
      TE.fromEither,
      TE.flatMap(executePutSecretValue(client, secretId))
    );

const updateSecret =
  (client: SecretsManagerClient) =>
  ({ container, key, newValue }: SecretUpdatePayload) =>
    pipe(
      consoleLog(`   🔐 Updating secret: ${container} [${key}]`),
      TE.flatMap(() => getSecretValue(client, container)),
      TE.map((current) => ({ ...current, [key]: newValue })),
      TE.flatMap(putSecretValue(client, container))
    );

export const updateAllSecrets = (config: Config): TE.TaskEither<Error, void> => {
  const client = createSecretsClient();
  const payloads = buildSecretUpdatePayloads(config);

  return pipe(
    consoleLog(`☁️  Updating ${payloads.length} secret/s in AWS...`),
    TE.flatMap(() => traverseTaskEither(updateSecret(client))(payloads)),
    returnVoid
  );
};
