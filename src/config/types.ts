import { z } from 'zod';
import { ConfigSchema, SecretSchema, ServiceSchema } from './schemas';

export type Config = z.infer<typeof ConfigSchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type Secret = z.infer<typeof SecretSchema>;

export type Environment = {
  seed: string;
  timestamp: string;
  configFile: string;
};
