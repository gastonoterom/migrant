import * as E from 'fp-ts/lib/Either';

const SAFE_IDENTIFIER_REGEX = /^[a-zA-Z0-9_]+$/;

export const validateUsername = (username: string): E.Either<Error, string> =>
  SAFE_IDENTIFIER_REGEX.test(username)
    ? E.right(username)
    : E.left(new Error(`Invalid username: "${username}" - only a-z, A-Z, 0-9, _ allowed`));

export const validatePassword = (password: string): E.Either<Error, string> =>
  SAFE_IDENTIFIER_REGEX.test(password)
    ? E.right(password)
    : E.left(
        new Error(
          `Invalid password: contains disallowed characters - only a-z, A-Z, 0-9, _ allowed`
        )
      );
