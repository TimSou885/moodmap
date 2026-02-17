import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getCareResourcesByLocation } from '../care-resources.js';

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export default async function careResourcesRoutes(app: FastifyInstance) {
  app.get('/care-resources', async (request: FastifyRequest, reply: FastifyReply) => {
    const parse = querySchema.safeParse(request.query);
    if (!parse.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: '請提供 lat 與 lng' },
      });
    }
    const resources = getCareResourcesByLocation(parse.data.lat, parse.data.lng);
    return reply.send({ data: resources });
  });
}
