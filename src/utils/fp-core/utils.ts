import * as A from 'fp-ts/lib/Array';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as J from 'fp-ts/lib/Json';
import * as TE from 'fp-ts/lib/TaskEither';
import { log } from '../log';

export const withContext =
  (context: string) =>
  (err: unknown): Error => {
    const error = E.toError(err);
    return new Error(context, { cause: error });
  };

export const traverseTE = A.traverse(TE.ApplicativeSeq);
export const traverseE = A.traverse(E.Applicative);

export const returnVoid: <E, V>(fa: TE.TaskEither<E, V>) => TE.TaskEither<E, void> = TE.map(
  () => undefined
);

export const consoleLog = (str: string) => TE.fromIO(() => log.info(str));

export const parseJsonRecord = (jsonString: string): E.Either<Error, J.JsonRecord> =>
  pipe(
    J.parse(jsonString),
    E.mapLeft(E.toError),
    E.flatMap((json) =>
      json !== null && typeof json === 'object' && !Array.isArray(json)
        ? E.right(json as J.JsonRecord)
        : E.left(new Error('Expected JSON object'))
    )
  );

export const stringifyJson = (json: unknown) => pipe(J.stringify(json), E.mapLeft(E.toError));
