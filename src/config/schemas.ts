import { z } from 'zod';

export const SecretSchema = z.object({
  container: z.string(),
  key: z.string(),
  database_name: z.string(),
});

export const ServiceSchema = z.object({
  name: z.string(),
  postgres_user: z.string(),
  environment: z.string(),
  databases: z.array(z.string()),
  secrets: z.array(SecretSchema),
  postgres_password: z.string().default(''),
});

export const ConfigSchema = z.object({
  host: z.string(),
  port: z.number(),
  admin_user: z.string(),
  admin_password: z.string(),
  services: z.array(ServiceSchema),
});
