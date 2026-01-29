import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';

const SAFE_IDENTIFIER_REGEX = /^[a-zA-Z0-9_]+$/;

export const validateUsername = (username: string): E.Either<Error, void> =>
  SAFE_IDENTIFIER_REGEX.test(username)
    ? E.right(undefined)
    : E.left(new Error(`Invalid username: "${username}" - only a-z, A-Z, 0-9, _ allowed`));

export const validatePassword = (password: string): E.Either<Error, void> =>
  SAFE_IDENTIFIER_REGEX.test(password)
    ? E.right(undefined)
    : E.left(
        new Error(
          `Invalid password: contains disallowed characters - only a-z, A-Z, 0-9, _ allowed`
        )
      );

export const validateCredentials = (username: string, password: string) =>
  pipe(
    validateUsername(username),
    E.flatMap(() => validatePassword(password))
  );
