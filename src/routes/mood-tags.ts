import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { query } from '../db/index.js';

export default async function moodTagsRoutes(app: FastifyInstance) {
  app.get('/mood-tags', async (_request: FastifyRequest, reply: FastifyReply) => {
    const result = await query<{ tag: string; valence: number; arousal: number; weather_emoji: string }>(
      'SELECT tag, valence, arousal, weather_emoji FROM mood_tags ORDER BY tag'
    );
    return reply.send({ data: result.rows });
  });
}
