import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { consoleLog, withContext } from '../../utils/fp-core';
import type { RestartDeploymentPayload } from './types';
import { buildRestartUrl } from './utils';

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

const postRestart = (token: string, payload: RestartDeploymentPayload) =>
  TE.tryCatch(
    () => unsafePostRestart(token, payload),
    withContext(`Failed to restart: ${payload.resourceName}`)
  );

export const restartDeployment =
  (token: string) =>
  (payload: RestartDeploymentPayload): TE.TaskEither<Error, void> =>
    pipe(
      consoleLog(`   🔄 Restarting: ${payload.resourceName}`),
      TE.flatMap(() => postRestart(token, payload))
    );
