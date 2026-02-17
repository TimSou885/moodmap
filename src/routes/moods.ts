import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createMood, getNearbyMoods, getMoodById } from '../services/mood.service.js';

const createBodySchema = z.object({
  content: z.string().max(150).default(''),
  mood_tag: z.string().min(1).max(20),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  precision_level: z.enum(['exact', 'neighborhood']).default('neighborhood'),
});

const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(10000).default(2000),
  limit: z.coerce.number().min(1).max(200).default(50),
});

export default async function moodsRoutes(app: FastifyInstance) {
  const auth = (app as FastifyInstance & { authenticate: (req: unknown, rep: unknown) => Promise<void> }).authenticate;
  app.post('/moods', {
    onRequest: [auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parse = createBodySchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: parse.error.flatten().fieldErrors },
      });
    }
    const userId = (request as any).user.sub;
    try {
      const result = await createMood({
        userId,
        content: parse.data.content,
        moodTag: parse.data.mood_tag,
        latitude: parse.data.latitude,
        longitude: parse.data.longitude,
        precisionLevel: parse.data.precision_level,
      });
      if (result.blocked) {
        return reply.status(400).send({
          error: {
            code: '4001',
            message: result.moderationMessage ?? '內容無法發佈',
            care_resources: true,
          },
        });
      }
      const m = result.mood!;
      return reply.status(201).send({
        data: {
          id: m.id,
          anonymous_alias: (request as any).user.anonymous_alias,
          content: m.content,
          mood_tag: m.mood_tag,
          weather_emoji: m.weather_emoji,
          expires_at: m.expires_at,
          created_at: m.created_at,
          alert_level: m.alert_level,
          care_message: result.careMessage,
        },
      });
    } catch (err: any) {
      if (err.message === 'RATE_LIMIT_MOOD') {
        return reply.status(429).send({
          error: { code: '4002', message: '發文頻率過高，請稍後再試' },
        });
      }
      if (err.message === 'INVALID_MOOD_TAG') {
        return reply.status(400).send({
          error: { code: 'INVALID_INPUT', message: '無效的心情標籤' },
        });
      }
      throw err;
    }
  });

  app.get('/moods/nearby', {
    onRequest: [auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parse = nearbyQuerySchema.safeParse(request.query);
    if (!parse.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: parse.error.flatten().fieldErrors },
      });
    }
    const userId = (request as any).user.sub;
    const moods = await getNearbyMoods(
      parse.data.lat,
      parse.data.lng,
      parse.data.radius,
      parse.data.limit,
      userId
    );
    return reply.send({
      data: moods.map((m) => ({
        id: m.id,
        content: m.content,
        mood_tag: m.mood_tag,
        weather_emoji: m.weather_emoji,
        anonymous_alias: m.anonymous_alias,
        valence: m.valence,
        arousal: m.arousal,
        lat: m.lat,
        lng: m.lng,
        reaction_count: m.reaction_count ?? 0,
        created_at: m.created_at,
      })),
    });
  });

  app.get<{ Params: { id: string } }>('/moods/:id', {
    onRequest: [auth],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = (request as any).user.sub;
    const mood = await getMoodById(request.params.id, userId);
    if (!mood) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: '找不到該心情文' },
      });
    }
    return reply.send({
      data: {
        id: mood.id,
        content: mood.content,
        mood_tag: mood.mood_tag,
        weather_emoji: mood.weather_emoji,
        anonymous_alias: mood.anonymous_alias,
        valence: mood.valence,
        arousal: mood.arousal,
        lat: mood.lat,
        lng: mood.lng,
        reaction_count: mood.reaction_count ?? 0,
        created_at: mood.created_at,
      },
    });
  });
}
