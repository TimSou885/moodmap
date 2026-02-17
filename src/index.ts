import 'dotenv/config';
import { buildApp } from './app.js';
import { config } from './config.js';
import { closePool } from './db/index.js';
import { closeRedis } from './db/redis.js';

async function main() {
  const app = await buildApp();
  try {
    await app.listen({ port: config.PORT, host: '0.0.0.0' });
    console.log(`MoodMap API listening on http://0.0.0.0:${config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  const shutdown = async () => {
    await app.close();
    await closePool();
    await closeRedis();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
