import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { addReaction, getReactionsByMoodId } from '../services/reaction.service.js';

const bodySchema = z.object({
  reaction_type: z.string().min(1).max(30),
});

export default async function reactionsRoutes(app: FastifyInstance) {
  app.post<{ Params: { id: string } }>('/moods/:id/reactions', {
    onRequest: [app.authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parse = bodySchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: parse.error.flatten().fieldErrors },
      });
    }
    const { ok, error } = await addReaction(
      request.params.id,
      (request as any).user.sub,
      parse.data.reaction_type
    );
    if (!ok) {
      if (error === 'ALREADY_REACTED') {
        return reply.status(400).send({
          error: { code: '4004', message: '已對此心情文回應過' },
        });
      }
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: '無效的回應類型' },
      });
    }
    return reply.status(201).send({ data: { ok: true } });
  });

  app.get<{ Params: { id: string } }>('/moods/:id/reactions', {
    onRequest: [app.authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const list = await getReactionsByMoodId(request.params.id);
    return reply.send({ data: list });
  });
}
