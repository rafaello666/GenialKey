import { Module } from '@nestjs/common';
import { TypingResultController } from './typing-result.controller';
import { TypingResultService } from './typing-result.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [TypingResultController],
  providers: [TypingResultService, PrismaService]
})
export class TypingResultModule {}
