import {
  GetSecretValueCommand,
  PutSecretValueCommand,
  SecretsManagerClient,
  type GetSecretValueCommandOutput,
} from '@aws-sdk/client-secrets-manager';
import { log } from '../../utils/log';
import type { SecretUpdatePayload } from './secrets.types';

export const createSecretsClient = (): SecretsManagerClient => new SecretsManagerClient({});

const parseJsonRecord = (jsonString: string): Record<string, unknown> => {
  try {
    const json = JSON.parse(jsonString);
    if (json !== null && typeof json === 'object' && !Array.isArray(json)) {
      return json as Record<string, unknown>;
    }
    throw new Error('Expected JSON object');
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }
};

const parseGetSecretResponse = (response: GetSecretValueCommandOutput): Record<string, unknown> => {
  if (!response.SecretString) {
    throw new Error("Can't process response, no secret string in AWS secret");
  }
  return parseJsonRecord(response.SecretString);
};

const getSecretValue = async (
  client: SecretsManagerClient,
  secretId: string
): Promise<Record<string, unknown>> => {
  try {
    const response = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
    return parseGetSecretResponse(response);
  } catch (err) {
    throw new Error(`Failed to get AWS secret: ${secretId}`, { cause: err });
  }
};

const putSecretValue = async (
  client: SecretsManagerClient,
  secretId: string,
  newValue: Record<string, unknown>
): Promise<void> => {
  let secretString: string;
  try {
    secretString = JSON.stringify(newValue);
  } catch (err) {
    throw new Error(`Failed to stringify secret for ${secretId}`, { cause: err });
  }
  try {
    await client.send(
      new PutSecretValueCommand({
        SecretId: secretId,
        SecretString: secretString,
      })
    );
  } catch (err) {
    throw new Error(`Failed to put AWS secret: ${secretId}`, { cause: err });
  }
};

export const updateSecret = async (
  client: SecretsManagerClient,
  { container, key, newValue }: SecretUpdatePayload
): Promise<void> => {
  log.info(`   🔐 Updating secret: ${container} [${key}]`);
  const current = await getSecretValue(client, container);
  const updated = { ...current, [key]: newValue };
  await putSecretValue(client, container, updated);
};
