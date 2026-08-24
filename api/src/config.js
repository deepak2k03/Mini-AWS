import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1),
  DOCKER_SOCKET_PATH: z.string().default('/var/run/docker.sock'),
  INSTANCE_IMAGE: z.string().min(1).default('mini-aws/ssh-instance:1.0.0'),
  SSH_PUBLIC_HOST: z.string().min(1).default('localhost'),
  INSTANCE_KEY_DIR: z.string().min(1).default('../instance-keys'),
  INSTANCE_NETWORK_NAME: z.string().trim().min(1).default('mini-aws-network'),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  DEMO_AUTH: z.enum(['true', 'false']).default('true'),
  // An empty value in .env means the optional AI feature is not configured yet.
  GEMINI_API_KEY: z.preprocess(value => typeof value === 'string' && !value.trim() ? undefined : value, z.string().trim().min(1).optional()),
  GEMINI_MODEL: z.string().trim().min(1).default('gemini-3.6-flash')
});

const values = schema.parse(process.env);
export const config = { ...values, DEMO_AUTH: values.DEMO_AUTH === 'true' };
