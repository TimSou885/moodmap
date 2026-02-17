import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { findOrCreateUser } from '../services/auth.service.js';

const bodySchema = z.object({
  device_fingerprint: z.string().min(1).max(64),
});

export default async function authRoutes(app: FastifyInstance) {
  app.post('/auth/anonymous', async (request: FastifyRequest, reply: FastifyReply) => {
    const parse = bodySchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: parse.error.flatten().fieldErrors },
      });
    }
    const { device_fingerprint } = parse.data;
    const user = await findOrCreateUser(device_fingerprint);
    const token = app.jwt.sign(
      { sub: user.id, anonymous_alias: user.anonymous_alias, type: 'access' },
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' }
    );
    return reply.status(201).send({
      data: {
        token,
        user: {
          id: user.id,
          anonymous_alias: user.anonymous_alias,
          subscription_tier: user.subscription_tier,
        },
      },
    });
  });
}
