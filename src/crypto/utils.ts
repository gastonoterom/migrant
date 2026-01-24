import { pbkdf2Sync } from 'crypto';

type DerivePasswordParams = {
  seed: string;
  timestamp: string;
  identifier: string;
};

export const derivePassword = ({ seed, timestamp, identifier }: DerivePasswordParams): string => {
  const salt = `${timestamp}:${identifier}`;
  const key = pbkdf2Sync(seed, salt, 100000, 32, 'sha256');
  return key.toString('hex');
};
