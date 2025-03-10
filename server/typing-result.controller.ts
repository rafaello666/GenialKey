import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { TypingResultService } from './typing-result.service';

@Controller('typing-results')
export class TypingResultController {
  constructor(private readonly typingResultService: TypingResultService) {}

  @Post()
  create(@Body() body: { userId: number; lessonId: number; wpm: number; accuracy: number }) {
    const { userId, lessonId, wpm, accuracy } = body;
    return this.typingResultService.recordResult(userId, lessonId, wpm, accuracy);
  }

  @Get('lesson/:lessonId')
  getResultsForLesson(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.typingResultService.getResultsForLesson(lessonId);
  }

  @Get('user/:userId')
  getUserResults(@Param('userId', ParseIntPipe) userId: number) {
    return this.typingResultService.getUserResults(userId);
  }
}
