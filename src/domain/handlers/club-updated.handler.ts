import { Logger } from '@nestjs/common';
import { EventsHandler } from '@nestjs/cqrs';

import { ClubUpdatedEvent } from '../events/club-updated.event';

@EventsHandler(ClubUpdatedEvent)
export class ClubUpdatedHandler {
  private readonly logger = new Logger(ClubUpdatedHandler.name);

  handle(event: ClubUpdatedEvent) {
    this.logger.log(`Club ${event.clubId} updated`);
  }
}
