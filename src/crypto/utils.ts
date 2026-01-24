import { createHmac } from 'crypto';

type DerivePasswordParams = {
  seed: string;
  timestamp: string;
  identifier: string;
};

// TODO: study theoretical safety
export const derivePassword = ({ seed, timestamp, identifier }: DerivePasswordParams): string => {
  const data = `${timestamp}:${identifier}`;
  return createHmac('sha256', seed).update(data).digest('hex');
};
