import { EventsHandler } from '@nestjs/cqrs';
import { SlotBookedEvent } from '../events/slot-booked.event';
import { RedisService } from '../../infrastructure/service/redis.service';

@EventsHandler(SlotBookedEvent)
export class SlotBookedEventHandler {
  constructor(private readonly redisService: RedisService) {}

  async handle(event: SlotBookedEvent): Promise<void> {
    const cacheKey = `slots:${event.clubId}:${event.courtId}:${event.slot.datetime.split('T')[0]}`;
    console.log(`[SlotBookedEvent] Invalidating cache for key: ${cacheKey}`);
    await this.redisService.del(cacheKey); 
  }
}
