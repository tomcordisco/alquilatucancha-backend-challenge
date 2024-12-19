import { EventsHandler } from '@nestjs/cqrs';
import { CourtUpdatedEvent } from '../events/court-updated.event';
import { RedisService } from '../../infrastructure/service/redis.service';

@EventsHandler(CourtUpdatedEvent)
export class CourtUpdatedEventHandler {
  constructor(private readonly redisService: RedisService) {}

  async handle(event: CourtUpdatedEvent): Promise<void> {
    const cacheKey = `courts:${event.clubId}`;
    console.log(`[CourtUpdatedEvent] Invalidating cache for key: ${cacheKey}`);
    await this.redisService.del(cacheKey); 
  }
}
