// src/stats/stats.controller.ts
import { Controller, Get } from '@nestjs/common';
import { StatsService } from './stats.service';
import { StatsDto } from './stats.dto';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async findAll(): Promise<StatsDto[]> {
    return this.statsService.findAllStats();
  }
}
