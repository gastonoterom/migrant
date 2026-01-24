import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import { derivePassword } from '../crypto';
import { traverseEither, withContext } from '../fp-core';
import { getEnvironment } from './environment';
import { ConfigSchema } from './schemas';
import type { Config, Service } from './types';

const parseYaml = (content: string): E.Either<Error, unknown> =>
  E.tryCatch(() => parse(content), withContext('Failed to parse YAML config'));

const parseConfig = (content: unknown): E.Either<Error, Config> =>
  pipe(ConfigSchema.safeParse(content), (result) =>
    result.success ? E.right(result.data) : E.left(result.error)
  );

const generateUniquePassword = (username: string): E.Either<Error, string> =>
  pipe(
    getEnvironment(),
    E.map(({ seed, timestamp }) => derivePassword({ seed, timestamp, identifier: username }))
  );

const fillServicePassword = (service: Service): E.Either<Error, Service> =>
  service.postgres_password
    ? E.right(service)
    : pipe(
        generateUniquePassword(service.postgres_user),
        E.map((password) => ({ ...service, postgres_password: password }))
      );

const addTimestampToUsername = (service: Service): E.Either<Error, Service> =>
  pipe(
    getEnvironment(),
    E.map(({ timestamp }) => ({
      ...service,
      postgres_user: `${service.postgres_user}_${timestamp}`,
    }))
  );

const transformService = (service: Service) =>
  pipe(service, addTimestampToUsername, E.flatMap(fillServicePassword));

const fillPasswords = (config: Config): E.Either<Error, Config> =>
  pipe(
    config.services,
    traverseEither(transformService),
    E.map((services) => ({ ...config, services }))
  );

export const readConfig = (path: string): TE.TaskEither<Error, Config> =>
  pipe(
    TE.tryCatch(() => readFile(path, 'utf-8'), withContext(`Failed to read config file: ${path}`)),
    TE.flatMapEither(parseYaml),
    TE.flatMapEither(parseConfig),
    TE.flatMapEither(fillPasswords)
  );
