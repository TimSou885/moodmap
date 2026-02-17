import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import moodsRoutes from './routes/moods.js';
import reactionsRoutes from './routes/reactions.js';
import careResourcesRoutes from './routes/care-resources.js';
import moodTagsRoutes from './routes/mood-tags.js';

export async function buildApp() {
  const app = Fastify({ logger: config.NODE_ENV !== 'test' });

  app.addHook('onRequest', (request, _reply, done) => {
    const cf = (request.headers['cf-connecting-ip'] as string) || request.headers['x-forwarded-for'];
    if (cf) (request as any).clientIp = (typeof cf === 'string' ? cf.split(',')[0] : cf[0])?.trim();
    done();
  });

  await app.register(cors, { origin: true });
  await app.register(jwt, {
    secret: config.JWT_SECRET,
    sign: { expiresIn: config.JWT_EXPIRES_IN },
  });

  app.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.status(401).send({
        error: { code: 'UNAUTHORIZED', message: '請先登入' },
      });
    }
  });

  app.get('/', async (_request, reply) => {
    return reply.send({
      name: 'MoodMap API',
      version: '0.1.0-alpha',
      docs: '/v1',
      endpoints: {
        moodTags: 'GET /v1/mood-tags',
        careResources: 'GET /v1/care-resources?lat=&lng=',
        auth: 'POST /v1/auth/anonymous',
        moods: 'POST /v1/moods, GET /v1/moods/nearby, GET /v1/moods/:id',
        reactions: 'POST /v1/moods/:id/reactions, GET /v1/moods/:id/reactions',
      },
    });
  });

  app.register(authRoutes, { prefix: '/v1' });
  app.register(careResourcesRoutes, { prefix: '/v1' });
  app.register(moodTagsRoutes, { prefix: '/v1' });
  app.register(moodsRoutes, { prefix: '/v1' });
  app.register(reactionsRoutes, { prefix: '/v1' });

  app.setErrorHandler((err, request, reply) => {
    request.log?.error?.(err);
    const status = (err as any).statusCode ?? 500;
    const message = status >= 500 ? '伺服器錯誤' : (err as Error).message;
    return reply.status(status).send({
      error: { code: 'SERVER_ERROR', message },
    });
  });

  return app;
}
