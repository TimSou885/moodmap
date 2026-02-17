import Redis from 'ioredis';
import { config } from '../config.js';

let client: unknown = null;

export function getRedis(): unknown {
  if (!client) {
    const Ctor = (Redis as unknown as { default?: new (url: string, opts?: object) => unknown }).default ?? Redis;
    client = new (Ctor as new (url: string, opts?: object) => unknown)(config.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 5) return null;
        return Math.min(times * 200, 2000);
      },
    });
  }
  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await (client as { quit: () => Promise<void> }).quit();
    client = null;
  }
}
