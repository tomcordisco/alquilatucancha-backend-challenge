import { EventsHandler } from '@nestjs/cqrs';
import { SlotAvailableEvent } from '../events/slot-cancelled.event';
import { RedisService } from 'src/infrastructure/service/redis.service';

@EventsHandler(SlotAvailableEvent)
export class SlotAvailableEventHandler {
  constructor(private readonly redisService: RedisService) {}

  async handle(event: SlotAvailableEvent): Promise<void> {
    const cacheKey = `slots:${event.clubId}:${event.courtId}:${event.slot.datetime.split('T')[0]}`;
    console.log(`[SlotAvailableEvent] Invalidating cache for key: ${cacheKey}`);
    await this.redisService.del(cacheKey); 
  }
}
