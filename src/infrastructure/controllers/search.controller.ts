import { Controller, Get, Query, UsePipes } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import * as moment from 'moment';
import { createZodDto, ZodValidationPipe } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { RedisService } from '../service/redis.service';

import {
  ClubWithAvailability,
  GetAvailabilityQuery,
} from '../../domain/commands/get-availaiblity.query';

const GetAvailabilitySchema = z.object({
  placeId: z.string(),
  date: z
    .string()
    .regex(/\d{4}-\d{2}-\d{2}/)
    .refine((date) => moment(date).isValid())
    .transform((date) => moment(date).toDate()),
});

class GetAvailabilityDTO extends createZodDto(GetAvailabilitySchema) {}

@Controller('search')
export class SearchController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  @UsePipes(ZodValidationPipe)
  async searchAvailability(
    @Query() query: GetAvailabilityDTO,
  ): Promise<ClubWithAvailability[]> {
    const cacheKey = `search:${query.placeId}:${moment(query.date).format(
      'YYYY-MM-DD',
    )}`;

    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      console.log(`[SearchController] Cache hit for key: ${cacheKey}`);
      return cachedData;
    }

    console.log(`[SearchController] Cache miss for key: ${cacheKey}`);

    const result = await this.queryBus.execute(
      new GetAvailabilityQuery(query.placeId, query.date),
    );

    await this.redisService.set(cacheKey, result, 300); 

    return result;
  }
}
